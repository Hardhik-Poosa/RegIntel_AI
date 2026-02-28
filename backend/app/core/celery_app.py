import os
from celery import Celery

_redis = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "regintel",
    broker=_redis,
    backend=_redis,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,          # results kept for 1 h
    task_acks_late=True,          # re-queue on worker crash
    worker_prefetch_multiplier=1, # one task at a time per worker
)

celery_app.autodiscover_tasks(["app.tasks"])