import hmac
import os
from typing import Annotated, Any
from uuid import UUID

from dramatiq import Message
from dramatiq.errors import ConnectionError as BrokerConnectionError
from dramatiq.results import ResultFailure, ResultMissing
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StrictStr, model_validator
from redis import Redis
from redis.exceptions import RedisError

from actors import REDIS_URL, RESULT_RETENTION_SECONDS, backend, broker, count_words

TOKEN = os.environ["DRAMATIQ_BRIDGE_TOKEN"]
if not TOKEN.strip():
    raise ValueError("DRAMATIQ_BRIDGE_TOKEN must not be empty")
redis = Redis.from_url(REDIS_URL)


def authenticate(authorization: Annotated[str | None, Header()] = None):
    if not hmac.compare_digest((authorization or "").encode(), f"Bearer {TOKEN}".encode()):
        raise HTTPException(401, "Unauthorized")


app = FastAPI(dependencies=[Depends(authenticate)])


class Job(BaseModel):
    model_config = ConfigDict(extra="forbid")
    actor: StrictStr
    args: list[Any] = Field(default_factory=list)
    kwargs: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def allowlisted_input(self):
        # An explicit registry keeps imports and arbitrary actor dispatch private.
        if self.actor != "count_words":
            raise ValueError("Unknown actor")
        if len(self.args) == 1 and not self.kwargs:
            text = self.args[0]
        elif not self.args and set(self.kwargs) == {"text"}:
            text = self.kwargs["text"]
        else:
            raise ValueError("Supply exactly one text argument")
        if not isinstance(text, str) or not 1 <= len(text) <= 10000:
            raise ValueError("text must contain 1–10000 characters")
        return self


@app.post("/v1/jobs", status_code=202)
def enqueue(job: Job):
    message = count_words.message(*job.args, **job.kwargs)
    key = f"xmcp:job:{message.message_id}"
    try:
        # Write first so a fast worker cannot outrun the lookup record. On an
        # ambiguous broker error keep it: the job might already be accepted.
        redis.set(key, message.encode(), ex=RESULT_RETENTION_SECONDS)
        broker.enqueue(message)
    except (RedisError, BrokerConnectionError):
        raise HTTPException(503, "Job submission unavailable; acceptance may be unknown") from None
    return {"jobId": message.message_id}


@app.get("/v1/jobs/{job_id}")
def result(job_id: UUID):
    try:
        encoded = redis.get(f"xmcp:job:{job_id}")
        if encoded is None:
            raise HTTPException(404, "Job not found or retention expired")
        message = Message.decode(encoded)
        try:
            value = message.get_result(backend=backend, block=False)
        except ResultMissing:
            return {"status": "unavailable"}
        except ResultFailure:
            return {"status": "failed", "error": "Actor execution failed"}
        return {"status": "succeeded", "result": value}
    except RedisError:
        raise HTTPException(503, "Result storage unavailable") from None
