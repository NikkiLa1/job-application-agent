import os

from langfuse import Langfuse

_client: Langfuse | None = None


def get_client() -> Langfuse:
    global _client
    if _client is None:
        _client = Langfuse(
            public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
            secret_key=os.environ["LANGFUSE_SECRET_KEY"],
            host=os.environ.get("LANGFUSE_HOST", "https://us.cloud.langfuse.com"),
        )
    return _client


def create_trace(run_id: str, job_url: str):
    return get_client().trace(
        id=run_id,
        name="job_application_agent",
        input={"job_url": job_url},
        tags=["job-agent"],
    )


def flush():
    get_client().flush()
