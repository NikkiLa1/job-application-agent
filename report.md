# Job Application Agent: An Agentic LLM Pipeline for Personalized Job Applications

**Nikki La**
DS 5730 — Final Project
April 2026

---

## Abstract

Job seekers often struggle to tailor their applications to specific roles, spending hours rewriting resumes and cover letters for each position. This project presents a fully deployed agentic AI web application that automates this process end to end. Given a resume PDF and a job posting URL, the system runs a seven-step LLM pipeline that researches the company, scores candidate fit using keyword analysis, rewrites the resume, generates a personalized cover letter, and produces interview preparation material. The system is deployed publicly, instrumented with observability tooling, and demonstrates a meaningful improvement in keyword match score from **8.7% to 24.6%** on a real-world job application.

---

## 1. Introduction

Applying for jobs is repetitive and time-consuming. Each application ideally requires a tailored resume and cover letter that mirrors the language and requirements of the specific role — a task that most candidates skip due to time constraints. Large language models are well-suited to automate this, but a single prompt is insufficient: researching the company, analyzing fit, tailoring a resume, and writing a cover letter require different tools, different context, and a logical sequence of operations.

This project addresses that problem through an **agentic pipeline** — a system where multiple LLM calls are chained together, each building on the outputs of the previous steps, to produce a complete, personalized job application package.

---

## 2. System Architecture

The application consists of a React frontend deployed on Vercel and a FastAPI backend deployed on Railway. The backend orchestrates a seven-step agent pipeline, persists results to Supabase, and traces every step with Langfuse.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React)                    │
│  UploadForm → StatusStepper → MetricsBadge → Results   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                         │
│  POST /api/run   GET /api/run/{id}   GET /api/metrics   │
│                                                         │
│  ┌─────────────────── Agent Pipeline ──────────────┐    │
│  │  1. parse_resume     (PyMuPDF)                  │    │
│  │  2. scrape_job       (GPT-4o-mini + web search) │    │
│  │  3. research_company (GPT-4o-mini + web search) │    │
│  │  4. analyze_fit      (GPT-4o-mini + NLTK)       │    │
│  │  5. tailor_resume    (GPT-4o-mini)              │    │
│  │  6. write_cover_letter (GPT-4o-mini)            │    │
│  │  7. interview_prep   (GPT-4o-mini)              │    │
│  └─────────────────────────────────────────────────┘    │
│                    │                   │                 │
│             Langfuse               Supabase              │
│           (tracing)             (persistence)            │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, react-markdown |
| Backend | Python 3.11, FastAPI, Uvicorn |
| LLM | OpenAI GPT-4o-mini (chat completions + web search via Responses API) |
| Observability | Langfuse (traces, spans, latency per step) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 3. Agentic Component

The system is genuinely agentic in the following ways:

**Sequential context accumulation.** Each step receives a shared `context` object and enriches it with its output. The resume text parsed in step 1 flows into step 4's fit analysis; the company research from step 3 flows into step 6's cover letter. No step operates in isolation — each depends on the outputs of prior steps.

**Tool use.** Steps 2 and 3 use the OpenAI Responses API with the `web_search_preview` tool to perform live web searches. This allows the agent to retrieve real-time job posting data and current company information rather than relying solely on training data.

**Dynamic decision-making.** The fit analysis step (step 4) computes a keyword match score between the resume and job description, identifies specific missing keywords, and passes those findings to the tailoring step. The tailoring step then uses that gap analysis to make targeted rewrites — a form of self-directed improvement.

**Error resilience.** If any step fails, the pipeline catches the exception, marks that step as errored in Supabase, and surfaces a clear error state to the user rather than silently failing.

### Pipeline Steps in Detail

| Step | Tool | Purpose |
|------|------|---------|
| `parse_resume` | PyMuPDF | Extract raw text from uploaded PDF |
| `scrape_job` | GPT-4o-mini + web search | Fetch and parse job posting into structured sections |
| `research_company` | GPT-4o-mini + web search | Research company mission, culture, news, tech stack |
| `analyze_fit` | GPT-4o-mini + NLTK | Score keyword overlap; identify strengths and gaps |
| `tailor_resume` | GPT-4o-mini | Rewrite resume bullets to match job language |
| `write_cover_letter` | GPT-4o-mini | Generate personalized cover letter |
| `interview_prep` | GPT-4o-mini | Produce 10 questions with STAR-method answer frameworks |

---

## 4. Metrics

### Metric 1: Match Score Improvement

The primary quality metric measures how much the resume improves in relevance to the job description after tailoring.

**Algorithm:**
1. Tokenize the job description using NLTK's `word_tokenize`
2. Remove English stopwords using NLTK's stopword corpus
3. Keep only alphabetic tokens longer than 2 characters
4. Compute the percentage of job description keywords that appear in the resume text
5. Run this computation twice: once on the original resume (before tailoring) and once on the tailored resume (after)
6. Report both scores and the delta

**Result on Thermo Fisher Data Scientist I role:**
- Before tailoring: **8.7%**
- After tailoring: **24.6%**
- Improvement: **+15.9 percentage points**

This improvement reflects the agent's ability to incorporate domain-specific terminology (e.g., statistical modeling, data pipelines, scientific computing) from the job description into the resume — language that a hiring manager or ATS system would be scanning for.

### Metric 2: Step Latency

The system records wall-clock latency in milliseconds for each of the seven pipeline steps. These are stored per-run in Supabase as a JSONB map and displayed live in the UI as each step completes.

This metric is meaningful for two reasons:
- It identifies bottlenecks in the pipeline (web search steps are consistently slower than base LLM steps)
- It gives users a real-time sense of progress and helps set expectations

Step latencies are also logged as Langfuse span durations, making them queryable across runs in the observability dashboard.

---

## 5. Observability

Every pipeline run is traced end to end using **Langfuse**. A trace is created per run using the `run_id` as the trace ID, and a span is opened and closed for each of the seven steps. Each span records:

- Step name
- Input context (step name, run metadata)
- Output status (`complete` or `error`)
- Latency in milliseconds
- Error message if applicable

Traces are tagged with `job-agent` and enriched with `job_title` and `company_name` metadata once the `scrape_job` step completes.

This makes it possible to:
- Replay individual runs and inspect what each step returned
- Compare latencies across runs
- Identify which steps fail most frequently
- Monitor overall pipeline health over time

**Langfuse Dashboard:** https://us.cloud.langfuse.com/project/cmnt8g7or007oad07h7qeilyr/dashboards

---

## 6. User Interface

The frontend is a single-page React application with two views:

**Upload View** — A drag-and-drop PDF uploader and job URL input field. On submission, the app calls `POST /api/run` and transitions to the results view.

**Results View** — Composed of four components:
- `MetricsBadge` — Displays match score before/after and total pipeline time prominently at the top
- `StatusStepper` — A vertical stepper showing all 7 steps with live status icons (pending / spinning / complete / error) and latency once each step finishes. Polls `GET /api/run/{id}` every 2 seconds.
- `ResultsPanel` — A tabbed interface with three tabs: Tailored Resume, Cover Letter, and Interview Prep. Each renders markdown output. Resume and Cover Letter tabs include a download button.

---

## 7. Results

The system was tested on the **Thermo Fisher Scientific Data Scientist I** role. The full pipeline completed successfully across all 7 steps.

**Key outputs:**
- **Match Score:** 8.7% → 24.6% (+15.9%)
- **Tailored Resume:** Resume rewritten with scientific computing and data pipeline terminology aligned to the role
- **Cover Letter:** Personalized letter referencing Thermo Fisher's mission in life sciences and the candidate's relevant analytical experience
- **Interview Prep:** 10 questions covering behavioral (STAR method), technical (statistical modeling, Python), and culture-fit angles specific to Thermo Fisher

---

## 8. Deployment

The application is fully deployed and publicly accessible:

- **Live App:** https://job-application-agent-m25e7mutf-nikki2.vercel.app
- **Backend API:** https://job-application-agent-production-e6c8.up.railway.app/docs
- **GitHub Repository:** https://github.com/NikkiLa1/job-application-agent
- **Langfuse Dashboard:** https://us.cloud.langfuse.com/project/cmnt8g7or007oad07h7qeilyr/dashboards

---

## 9. Conclusion

This project demonstrates that a multi-step agentic LLM pipeline can meaningfully automate one of the most time-consuming parts of job searching. By chaining seven specialized steps — each building on the last — the system produces a complete, personalized application package in a matter of minutes. The 15.9 percentage point improvement in keyword match score on a real job posting validates the core hypothesis: targeted LLM-driven tailoring produces measurably more relevant application materials than an untailored resume.

Future work could include support for multiple resume formats, ATS score simulation, A/B testing of cover letter styles, and a feedback loop where the candidate rates outputs to improve future generations.

---

## References

- OpenAI. (2024). *GPT-4o-mini model card.* https://openai.com/index/gpt-4o-mini
- Langfuse. (2024). *Open source LLM observability.* https://langfuse.com
- Supabase. (2024). *Open source Firebase alternative.* https://supabase.com
- FastAPI. (2024). *FastAPI documentation.* https://fastapi.tiangolo.com
- Bird, S., Klein, E., & Loper, E. (2009). *Natural Language Processing with Python.* O'Reilly Media.
