FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn httpx apscheduler

COPY main.py .

USER 1000:1000

CMD ["python", "main.py"]
