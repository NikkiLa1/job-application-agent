import os

import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# Build search-grounded model
try:
    from google.generativeai.types import GoogleSearchRetrieval, Tool

    _search_tool = Tool(google_search_retrieval=GoogleSearchRetrieval())
except Exception:
    # Fallback: dict-style tool definition
    _search_tool = {"google_search_retrieval": {}}  # type: ignore

_search_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    tools=[_search_tool],
)
_base_model = genai.GenerativeModel("gemini-2.0-flash")


def scrape_job(context: dict) -> None:
    """Use Gemini with Google Search grounding to parse the job posting."""
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

    response = _search_model.generate_content(prompt)
    job_text = response.text

    # Extract structured job_title and company_name
    extract_prompt = f"""From the job posting information below, extract ONLY the job title and company name.

{job_text}

Reply with exactly two lines:
JOB_TITLE: <title>
COMPANY_NAME: <name>"""

    extract_response = _base_model.generate_content(extract_prompt)
    job_title, company_name = "", ""
    for line in extract_response.text.strip().splitlines():
        if line.startswith("JOB_TITLE:"):
            job_title = line.replace("JOB_TITLE:", "").strip()
        elif line.startswith("COMPANY_NAME:"):
            company_name = line.replace("COMPANY_NAME:", "").strip()

    context["job_info"] = {
        "job_title": job_title,
        "company_name": company_name,
        "raw_text": job_text,
    }
