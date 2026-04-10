import os

from openai import OpenAI

_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def write_cover_letter(context: dict) -> None:
    """Write a personalized cover letter using company research and tailored resume."""
    job_info = context["job_info"]
    company_research = context["company_research"]
    tailored_resume = context["tailored_resume"]
    fit_analysis = context["fit_analysis"]

    response = _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"""Write a compelling, highly personalized cover letter for this job application.

JOB INFORMATION:
{job_info['raw_text']}

COMPANY RESEARCH:
{company_research}

CANDIDATE'S TAILORED RESUME:
{tailored_resume}

FIT ANALYSIS:
{fit_analysis}

Requirements:
1. Open with a strong, specific hook that references something concrete about the company
2. Connect the candidate's top 2-3 achievements directly to the role's requirements
3. Reference specific company details (mission, recent news, culture) to show genuine interest
4. Keep it to 3-4 focused paragraphs — no fluff
5. Professional but warm and human tone
6. Close with a confident, specific call to action
7. Format as clean markdown

Avoid clichés like "I am writing to express my interest" or "I am a hard worker".""",
            }
        ],
    )
    context["cover_letter"] = response.choices[0].message.content
