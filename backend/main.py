import asyncio
import os
import uuid

import nltk
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Download NLTK data on startup
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

from agent.pipeline import run_pipeline
from services.supabase_client import create_run, get_all_runs, get_run

app = FastAPI(title="Job Application Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/run")
async def start_run(
    background_tasks: BackgroundTasks,
    resume: UploadFile = File(...),
    job_url: str = Form(...),
):
    run_id = str(uuid.uuid4())
    resume_bytes = await resume.read()

    await asyncio.to_thread(create_run, run_id, job_url)
    background_tasks.add_task(run_pipeline, run_id, resume_bytes, job_url)

    return {"run_id": run_id}


@app.get("/api/run/{run_id}")
async def get_run_status(run_id: str):
    run = await asyncio.to_thread(get_run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.get("/api/metrics")
async def get_metrics():
    runs = await asyncio.to_thread(get_all_runs)
    complete_runs = [r for r in runs if r.get("status") == "complete"]

    if not complete_runs:
        return {
            "total_runs": len(runs),
            "complete_runs": 0,
            "avg_match_score_before": 0,
            "avg_match_score_after": 0,
            "avg_match_score_improvement": 0,
            "avg_total_time_ms": 0,
        }

    avg_before = (
        sum(r.get("match_score_before", 0) or 0 for r in complete_runs)
        / len(complete_runs)
    )
    avg_after = (
        sum(r.get("match_score_after", 0) or 0 for r in complete_runs)
        / len(complete_runs)
    )

    def total_time(r):
        latencies = r.get("step_latencies") or {}
        return sum(
            v.get("latency_ms", 0) or 0
            for v in latencies.values()
            if isinstance(v, dict)
        )

    avg_time = sum(total_time(r) for r in complete_runs) / len(complete_runs)

    return {
        "total_runs": len(runs),
        "complete_runs": len(complete_runs),
        "avg_match_score_before": round(avg_before, 1),
        "avg_match_score_after": round(avg_after, 1),
        "avg_match_score_improvement": round(avg_after - avg_before, 1),
        "avg_total_time_ms": round(avg_time),
    }
