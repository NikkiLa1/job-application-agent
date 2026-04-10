import os

from openai import OpenAI

_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def research_company(context: dict) -> None:
    """Use OpenAI with web search to research the company."""
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

    response = _client.responses.create(
        model="gpt-4o-mini",
        tools=[{"type": "web_search_preview"}],
        input=prompt,
    )
    context["company_research"] = response.output_text
