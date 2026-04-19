from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.events import router as events_router
from app.routes.settings import router as settings_router

load_dotenv()
app = FastAPI(title="Student Scheduler API")

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


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend running"}