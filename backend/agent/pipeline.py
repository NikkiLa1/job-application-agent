import asyncio
import time
import traceback

from agent.steps.analyze_fit import analyze_fit
from agent.steps.interview_prep import interview_prep
from agent.steps.parse_resume import parse_resume
from agent.steps.research_company import research_company
from agent.steps.scrape_job import scrape_job
from agent.steps.tailor_resume import tailor_resume
from agent.steps.write_cover_letter import write_cover_letter
from services.langfuse_client import create_trace, flush
from services.supabase_client import update_run

STEPS = [
    ("parse_resume", parse_resume),
    ("scrape_job", scrape_job),
    ("research_company", research_company),
    ("analyze_fit", analyze_fit),
    ("tailor_resume", tailor_resume),
    ("write_cover_letter", write_cover_letter),
    ("interview_prep", interview_prep),
]


async def run_pipeline(run_id: str, resume_bytes: bytes, job_url: str) -> None:
    trace = create_trace(run_id, job_url)

    context: dict = {
        "run_id": run_id,
        "job_url": job_url,
        "resume_bytes": resume_bytes,
        "resume_text": None,
        "job_info": None,
        "company_research": None,
        "fit_analysis": None,
        "matched_keywords": [],
        "missing_keywords": [],
        "tailored_resume": None,
        "cover_letter": None,
        "interview_prep": None,
        "match_score_before": None,
        "match_score_after": None,
    }

    step_latencies = {
        name: {"status": "pending", "latency_ms": None} for name, _ in STEPS
    }

    await asyncio.to_thread(update_run, run_id, {"status": "running", "step_latencies": step_latencies})

    try:
        for step_name, step_fn in STEPS:
            step_latencies[step_name]["status"] = "running"
            await asyncio.to_thread(
                update_run, run_id, {"step_latencies": dict(step_latencies)}
            )

            span = trace.span(name=step_name, input={"step": step_name})
            start = time.time()

            try:
                await asyncio.to_thread(step_fn, context)
                latency_ms = int((time.time() - start) * 1000)
                step_latencies[step_name] = {"status": "complete", "latency_ms": latency_ms}
                span.end(output={"status": "complete", "latency_ms": latency_ms})
            except Exception as step_err:
                latency_ms = int((time.time() - start) * 1000)
                step_latencies[step_name] = {"status": "error", "latency_ms": latency_ms}
                span.end(
                    output={"status": "error", "error": str(step_err)},
                    level="ERROR",
                )
                raise step_err

            # Persist step-specific results to Supabase
            db_update: dict = {"step_latencies": dict(step_latencies)}

            if step_name == "scrape_job" and context.get("job_info"):
                info = context["job_info"]
                db_update["job_title"] = info.get("job_title", "")
                db_update["company_name"] = info.get("company_name", "")
                trace.update(
                    metadata={
                        "job_title": info.get("job_title", ""),
                        "company_name": info.get("company_name", ""),
                    }
                )

            if step_name == "analyze_fit":
                db_update["match_score_before"] = context.get("match_score_before")

            if step_name == "tailor_resume":
                db_update["result_resume"] = context.get("tailored_resume")
                db_update["match_score_after"] = context.get("match_score_after")

            if step_name == "write_cover_letter":
                db_update["result_cover_letter"] = context.get("cover_letter")

            if step_name == "interview_prep":
                db_update["result_interview_prep"] = context.get("interview_prep")

            await asyncio.to_thread(update_run, run_id, db_update)

        await asyncio.to_thread(update_run, run_id, {"status": "complete"})
        trace.update(output={"status": "complete"})

    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        await asyncio.to_thread(
            update_run,
            run_id,
            {
                "status": "error",
                "error_message": error_msg[:2000],
                "step_latencies": step_latencies,
            },
        )
        trace.update(output={"status": "error", "error": str(exc)}, level="ERROR")

    finally:
        flush()
