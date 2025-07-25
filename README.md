# To Activate Environment

*`.\orbitenv\Scripts\activate`

# To Activate Everything

*FastAPI:
*`uvicorn main:app --reload --port 8001`

*Celery:
*`celery -A django_backend worker --pool=solo --loglevel=info`

*Docker:
*`docker run -d --name redis -p 6379:6379 redis`

*Trigger the task:
*`python manage.py shell`
*`from core.tasks import run_prediction_task`
*`run_prediction_task.delay(123, 456)`