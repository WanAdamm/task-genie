from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes.events import router as events_router

load_dotenv()
app = FastAPI(title="Student Scheduler API")

app.include_router(events_router, prefix="/events", tags=["events"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend running"}