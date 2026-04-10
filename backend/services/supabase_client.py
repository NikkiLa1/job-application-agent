import os

from supabase import Client, create_client

_client: Client | None = None

STEP_NAMES = [
    "parse_resume",
    "scrape_job",
    "research_company",
    "analyze_fit",
    "tailor_resume",
    "write_cover_letter",
    "interview_prep",
]


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_KEY"],
        )
    return _client


def _initial_step_latencies() -> dict:
    return {name: {"status": "pending", "latency_ms": None} for name in STEP_NAMES}


def create_run(run_id: str, job_url: str) -> None:
    get_client().table("job_runs").insert(
        {
            "id": run_id,
            "job_url": job_url,
            "status": "pending",
            "step_latencies": _initial_step_latencies(),
        }
    ).execute()


def update_run(run_id: str, data: dict) -> None:
    get_client().table("job_runs").update(data).eq("id", run_id).execute()


def get_run(run_id: str) -> dict | None:
    result = (
        get_client().table("job_runs").select("*").eq("id", run_id).execute()
    )
    return result.data[0] if result.data else None


def get_all_runs() -> list[dict]:
    result = (
        get_client()
        .table("job_runs")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
