import os

import google.generativeai as genai

from agent.metrics import compute_match_score

_model = genai.GenerativeModel("gemini-2.0-flash")


def tailor_resume(context: dict) -> None:
    """Rewrite resume bullet points to better match the job description."""
    resume_text = context["resume_text"]
    job_info = context["job_info"]
    fit_analysis = context["fit_analysis"]
    missing_keywords = context.get("missing_keywords", [])

    prompt = f"""Rewrite and tailor this resume to best match the following job posting.

JOB REQUIREMENTS:
{job_info['raw_text']}

ORIGINAL RESUME:
{resume_text}

FIT ANALYSIS:
{fit_analysis}

MISSING KEYWORDS TO INCORPORATE (only where truthful and relevant):
{', '.join(missing_keywords[:20])}

Rules:
1. Do NOT fabricate experience — keep all facts accurate
2. Rewrite bullet points to mirror the language and keywords from the job posting
3. Prioritize the most relevant experience at the top of each section
4. Add quantifiable impact where the original is vague ("increased X by Y%")
5. Align the summary/objective directly to this specific role
6. Output a complete, professionally formatted resume in markdown

Output the full tailored resume only — no commentary."""

    response = _model.generate_content(prompt)
    tailored = response.text
    context["tailored_resume"] = tailored

    # Match score AFTER tailoring
    match_after = compute_match_score(tailored, job_info["raw_text"])
    context["match_score_after"] = match_after["score"]
