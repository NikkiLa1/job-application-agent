# Job Application Agent

An agentic AI web app that turbocharges your job applications. Upload your resume and paste a job posting URL — the pipeline researches the company, scores your fit, tailors your resume, writes a cover letter, and generates 10 interview questions with answer frameworks.

DS 5730 Final Project

---

## Live Demo

[job-application-agent-m25e7mutf-nikki2.vercel.app](https://job-application-agent-m25e7mutf-nikki2.vercel.app)

## Langfuse Dashboard

[View Observability Dashboard](https://us.cloud.langfuse.com/project/cmnt8g7or007oad07h7qeilyr/dashboards)

---

## Architecture

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

---

## Metrics

| Metric | Description |
|--------|-------------|
| **Match Score Improvement** | Keyword overlap % between the job description and resume — computed before tailoring and after. Delta = `score_after - score_before`. Uses NLTK tokenization with stopword removal. |
| **Step Latency (ms)** | Wall-clock time in milliseconds for each of the 7 pipeline steps, shown live in the UI and stored in Supabase as a JSONB map. |

---

## Supabase Setup

Create a table called `job_runs` with this SQL:

```sql
create table job_runs (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  job_url               text,
  company_name          text,
  job_title             text,
  status                text default 'pending',
  match_score_before    float,
  match_score_after     float,
  step_latencies        jsonb,
  result_resume         text,
  result_cover_letter   text,
  result_interview_prep text,
  error_message         text
);
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase project (create table above)
- OpenAI API key
- Langfuse account

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Fill in your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# .env already configured for local dev (VITE_API_URL=http://localhost:8000)
npm run dev
```

Open http://localhost:5173

---

## Deployment

### Backend → Railway

1. Create a new Railway project and connect this repo
2. Set the **Root Directory** to `backend`
3. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env.example` in the Variables tab
5. Deploy — Railway auto-detects Python and installs `requirements.txt`

### Frontend → Vercel

1. Import this repo into Vercel
2. Set **Framework Preset** to `Vite` and **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `LANGFUSE_PUBLIC_KEY` | Langfuse project public key |
| `LANGFUSE_SECRET_KEY` | Langfuse project secret key |
| `LANGFUSE_HOST` | Langfuse host (e.g. `https://us.cloud.langfuse.com`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/publishable key |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, react-markdown
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **LLM**: OpenAI GPT-4o-mini (with web search for research steps)
- **Observability**: Langfuse (trace + spans per step)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend) + Railway (backend)
