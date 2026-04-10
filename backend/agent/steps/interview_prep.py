import os

import google.generativeai as genai

_model = genai.GenerativeModel("gemini-2.0-flash")


def interview_prep(context: dict) -> None:
    """Generate 10 likely interview questions with answer frameworks."""
    job_info = context["job_info"]
    company_research = context["company_research"]
    resume_text = context["resume_text"]
    fit_analysis = context["fit_analysis"]

    prompt = f"""Generate comprehensive interview preparation material for this job application.

JOB REQUIREMENTS:
{job_info['raw_text']}

COMPANY INFORMATION:
{company_research}

CANDIDATE RESUME:
{resume_text}

FIT ANALYSIS:
{fit_analysis}

Generate exactly 10 likely interview questions with detailed answer frameworks.

For each question provide:
1. **The Question** — stated clearly
2. **Why They Ask This** — the hiring intent behind the question
3. **Answer Framework** — structured approach (use STAR method for behavioral questions)
4. **Key Talking Points** — specific examples from the candidate's background to reference
5. **Likely Follow-ups** — 1-2 follow-up questions to anticipate

Include a balanced mix of:
- Behavioral questions (3-4)
- Technical / skills-based questions (3-4)
- Company & culture fit questions (1-2)
- Role-specific scenario questions (1-2)

Format as clean, numbered markdown."""

    response = _model.generate_content(prompt)
    context["interview_prep"] = response.text
