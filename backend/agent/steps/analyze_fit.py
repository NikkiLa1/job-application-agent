import os

import google.generativeai as genai

from agent.metrics import compute_match_score

_model = genai.GenerativeModel("gemini-2.0-flash")


def analyze_fit(context: dict) -> None:
    """Compare resume against job requirements and compute keyword match score."""
    resume_text = context["resume_text"]
    job_info = context["job_info"]

    # Keyword-based match score BEFORE tailoring
    match = compute_match_score(resume_text, job_info["raw_text"])
    context["match_score_before"] = match["score"]
    context["matched_keywords"] = match["matched"]
    context["missing_keywords"] = match["missing"]

    prompt = f"""Analyze the fit between this candidate's resume and the job requirements.

JOB REQUIREMENTS:
{job_info['raw_text']}

CANDIDATE RESUME:
{resume_text}

KEYWORD ANALYSIS:
- Match Score: {match['score']}%
- Matched Keywords: {', '.join(match['matched'][:20])}
- Missing Keywords: {', '.join(match['missing'][:20])}

Provide:
1. **Overall Fit** — strong / moderate / weak, with explanation
2. **Key Strengths** — where the candidate clearly aligns with the role
3. **Notable Gaps** — skills or experience the candidate lacks
4. **Tailoring Recommendations** — specific ways to strengthen the application
5. **Red Flags** — anything that could concern a hiring manager (if any)"""

    response = _model.generate_content(prompt)
    context["fit_analysis"] = response.text
