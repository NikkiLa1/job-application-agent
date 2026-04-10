import os

import google.generativeai as genai

try:
    from google.generativeai.types import GoogleSearchRetrieval, Tool

    _search_tool = Tool(google_search_retrieval=GoogleSearchRetrieval())
except Exception:
    _search_tool = {"google_search_retrieval": {}}  # type: ignore

_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    tools=[_search_tool],
)


def research_company(context: dict) -> None:
    """Use Gemini with Google Search grounding to research the company."""
    job_info = context["job_info"]
    company_name = job_info.get("company_name", "the company")
    job_title = job_info.get("job_title", "this role")

    prompt = f"""Research {company_name} thoroughly for a candidate applying for a {job_title} position.

Find and summarize:
1. **Mission & Values** — what the company stands for
2. **Culture & Work Environment** — team dynamics, work-life balance, remote policy
3. **Recent News** — major announcements or developments in the last 12 months
4. **Tech Stack** — technologies, tools, and frameworks they use
5. **Interview Culture** — interview process, style, and tips (from Glassdoor, Blind, LinkedIn)
6. **Company Size & Growth** — headcount, funding, trajectory
7. **Products & Achievements** — flagship products and notable milestones
8. **Why Join** — what makes this company unique or compelling

This research will be used to personalize a job application and cover letter."""

    response = _model.generate_content(prompt)
    context["company_research"] = response.text
