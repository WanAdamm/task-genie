from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from models.event import EventCreate
from services.firestore import get_events_collection
from services.llm_planner import generate_assignment_plan


router = APIRouter()


# ----------------------------------------
# Utility: Convert Firestore values → JSON-safe
# ----------------------------------------
def serialize_firestore_value(value):
    # Firestore returns datetime objects → convert to ISO string for frontend
    if isinstance(value, datetime):
        return value.isoformat()
    return value


# ----------------------------------------
# Utility: Convert Firestore document → dict
# ----------------------------------------
def serialize_doc(doc):
    data = doc.to_dict()

    # Attach doc ID + serialize all fields
    return {
        "id": doc.id,
        **{key: serialize_firestore_value(value) for key, value in data.items()},
    }


# ----------------------------------------
# POST /events
# Create a new calendar event
# ----------------------------------------
@router.post("")
def create_event(payload: EventCreate):
    # --- Basic validation ---
    if payload.end <= payload.start:
        raise HTTPException(status_code=400, detail="end must be later than start")

    start_dt = payload.start
    end_dt = payload.end

    # --- Generate calendar grouping keys ---
    # Used for querying/filtering later
    iso_year, iso_week, _ = start_dt.isocalendar()
    week_key = f"{iso_year}-W{iso_week:02d}"

    # --- Timestamps for audit tracking ---
    created_at = datetime.now(timezone.utc)
    updated_at = created_at

    # --- Final document to store in Firestore ---
    doc_data = {
        "title": payload.title,
        "category": payload.category,
        "calendarId": payload.calendarId,

        # ISO strings → used by frontend (FullCalendar)
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat(),

        # Native datetime → used for Firestore querying
        "startTs": start_dt,
        "endTs": end_dt,

        # Precomputed keys → avoid heavy queries later
        "dateKey": start_dt.strftime("%Y-%m-%d"),
        "yearMonth": start_dt.strftime("%Y-%m"),
        "weekKey": week_key,

        "status": payload.status,
        "priority": payload.priority,
        "source": payload.source,
        "isLocked": payload.isLocked,

        # Optional linkage to planning system
        "assignmentId": payload.assignmentId,

        # Nested objects (kept structured)
        "conflict": payload.conflict.model_dump(),
        "meta": payload.meta.model_dump(),

        # Audit timestamps
        "createdAt": created_at,
        "updatedAt": updated_at,
    }

    # --- Write to Firestore ---
    doc_ref = get_events_collection().document()
    doc_ref.set(doc_data)

    # Return serialized version
    return {
        "id": doc_ref.id,
        **{k: serialize_firestore_value(v) for k, v in doc_data.items()},
    }


# ----------------------------------------
# GET /events
# Fetch events with optional date filtering
# ----------------------------------------
@router.get("")
def list_events(
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
):
    collection = get_events_collection()

    try:
        # ----------------------------------------
        # Case 1: start + end provided (FULL RANGE)
        # ----------------------------------------
        if start and end:
            start_dt = datetime.fromisoformat(start)
            end_dt = datetime.fromisoformat(end)

            if end_dt <= start_dt:
                raise HTTPException(status_code=400, detail="end must be later than start")

            # IMPORTANT:
            # This uses "overlap logic" (correct for calendars)
            # event.start < requestedEnd
            # AND
            # event.end > requestedStart
            query = (
                collection
                .where("startTs", "<", end_dt)
                .where("endTs", ">", start_dt)
                .order_by("startTs")
            )

            docs = query.stream()

        # ----------------------------------------
        # Case 2: only start provided
        # ----------------------------------------
        elif start:
            start_dt = datetime.fromisoformat(start)

            # Get events that END after this point
            query = (
                collection
                .where("endTs", ">", start_dt)
                .order_by("startTs")
            )

            docs = query.stream()

        # ----------------------------------------
        # Case 3: only end provided
        # ----------------------------------------
        elif end:
            end_dt = datetime.fromisoformat(end)

            # Get events that START before this point
            query = (
                collection
                .where("startTs", "<", end_dt)
                .order_by("startTs")
            )

            docs = query.stream()

        # ----------------------------------------
        # Case 4: no filters → return all
        # ----------------------------------------
        else:
            docs = collection.order_by("startTs").stream()

        # Convert Firestore docs → JSON response
        return [serialize_doc(doc) for doc in docs]

    except ValueError:
        # Invalid datetime format from client
        raise HTTPException(
            status_code=400,
            detail="Invalid datetime format. Use ISO 8601 format.",
        )


# ----------------------------------------
# POST /events/generate-plan
# Generate study schedule via Gemini
# ----------------------------------------
class AssignmentPlanCreate(BaseModel):
    courseName: str
    dueDate: str
    assignmentType: str
    priority: str
    difficulty: int
    requirements: str

@router.post("/generate-plan")
def generate_plan(payload: AssignmentPlanCreate):
    try:
        try:
            # Try parsing ISO timestamp (standard from input type="date" or datetime-local)
            # Remove potential Z / timezone markers to parse clean local or UTC datetime
            clean_date = payload.dueDate
            if clean_date.endswith("Z"):
                clean_date = clean_date[:-1] + "+00:00"
            due_dt = datetime.fromisoformat(clean_date)
        except ValueError:
            # Fallback if only date is passed e.g. YYYY-MM-DD
            try:
                due_dt = datetime.strptime(payload.dueDate, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid dueDate format. Use YYYY-MM-DD or ISO 8601.")

        events = generate_assignment_plan(
            course_name=payload.courseName,
            due_date=due_dt,
            assignment_type=payload.assignmentType,
            priority=payload.priority,
            difficulty=payload.difficulty,
            requirements=payload.requirements
        )
        return {"status": "success", "events": events}
    except ValueError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")