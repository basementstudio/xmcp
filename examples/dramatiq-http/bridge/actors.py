import os

import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.results import Results
from dramatiq.results.backends import RedisBackend

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
# Retain both lookup metadata and results for the same documented interval.
RESULT_RETENTION_SECONDS = int(os.environ.get("RESULT_RETENTION_SECONDS", "600"))
if RESULT_RETENTION_SECONDS <= 0:
    raise ValueError("RESULT_RETENTION_SECONDS must be positive")
broker = RedisBroker(url=REDIS_URL)
backend = RedisBackend(url=REDIS_URL)
broker.add_middleware(Results(backend=backend, result_ttl=RESULT_RETENTION_SECONDS * 1000))
dramatiq.set_broker(broker)


# No retries: a failed job is reported once instead of running again.
@dramatiq.actor(store_results=True, max_retries=0)
def count_words(text: str):
    words = text.split()
    if not words:
        raise ValueError("text contains no words")
    return {"words": len(words)}
