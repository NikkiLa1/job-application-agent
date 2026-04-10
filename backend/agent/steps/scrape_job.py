import os

from openai import OpenAI

_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def scrape_job(context: dict) -> None:
    """Use OpenAI with web search to fetch and parse the job posting."""
    job_url = context["job_url"]

    prompt = f"""Fetch and analyze the job posting at this URL: {job_url}

Extract the following information clearly:
- Job Title
- Company Name
- Required Skills (bulleted list)
- Key Responsibilities (bulleted list)
- Required Qualifications (bulleted list)
- Nice-to-Have Skills (bulleted list, if present)
- Salary Range (if mentioned)
- Location / Remote Policy

Use clear section headers for each category."""

    response = _client.responses.create(
        model="gpt-4o-mini",
        tools=[{"type": "web_search_preview"}],
        input=prompt,
    )
    job_text = response.output_text

    # Extract job_title and company_name
    extract_response = _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"""From the job posting information below, extract ONLY the job title and company name.

{job_text}

Reply with exactly two lines:
JOB_TITLE: <title>
COMPANY_NAME: <name>""",
            }
        ],
    )
    extract_text = extract_response.choices[0].message.content or ""

    job_title, company_name = "", ""
    for line in extract_text.strip().splitlines():
        if line.startswith("JOB_TITLE:"):
            job_title = line.replace("JOB_TITLE:", "").strip()
        elif line.startswith("COMPANY_NAME:"):
            company_name = line.replace("COMPANY_NAME:", "").strip()

    context["job_info"] = {
        "job_title": job_title,
        "company_name": company_name,
        "raw_text": job_text,
    }
