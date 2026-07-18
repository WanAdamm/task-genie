from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.events import router as events_router
from routes.settings import router as settings_router
from routes.assignment_plans import router as assignment_plans_router
from services.document_extractor import MAX_TOTAL_BYTES
from services.request_limits import RequestBodyLimitMiddleware

load_dotenv()
app = FastAPI(title="Student Scheduler API")
app.add_middleware(
    RequestBodyLimitMiddleware,
    path="/assignment-plans/extract",
    max_body_bytes=MAX_TOTAL_BYTES + 256 * 1024,
)

# ----------------------------------------
# CORS CONFIG
# Allow your frontend to call this API
# ----------------------------------------

origins = [
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Which frontends can access
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, etc.
    allow_headers=["*"],          # Allow all headers
)

app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(settings_router, prefix="/settings", tags=["settings"])
app.include_router(
    assignment_plans_router,
    prefix="/assignment-plans",
    tags=["assignment-plans"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend running"}
