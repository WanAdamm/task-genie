from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from models.setting import SettingResponse, SettingCreate
from services.auth import get_current_user
from services.firestore import getUserSettings

router = APIRouter()


# ----------------------------------------
# Utility: Convert Firestore values → JSON-safe
# ----------------------------------------
def serialize_firestore_value(value):
    # Firestore timestamps come back as datetime objects
    # Convert them into ISO strings for JSON responses
    if isinstance(value, datetime):
        return value.isoformat()

    # If nested dict, serialize each value recursively
    if isinstance(value, dict):
        return {k: serialize_firestore_value(v) for k, v in value.items()}

    # If list, serialize each item recursively
    if isinstance(value, list):
        return [serialize_firestore_value(v) for v in value]

    return value


# ----------------------------------------
# Utility: Convert Firestore document → dict
# ----------------------------------------
def serialize_doc(doc):
    data = doc.to_dict()

    return {
        **{key: serialize_firestore_value(value) for key, value in data.items()}
    }


def normalize_courses(courses):
    if not isinstance(courses, list):
        return []

    normalized = []
    seen = set()

    for course in courses:
        if not isinstance(course, str):
            continue

        course_name = course.strip()
        if not course_name or course_name in seen:
            continue

        seen.add(course_name)
        normalized.append(course_name)

    return normalized

# ----------------------------------------
# POST /settings
# Create or replace app settings
# ----------------------------------------
@router.put("")
def update_settings(payload: SettingCreate, current_user=Depends(get_current_user)):
    user_id = current_user["uid"]
    doc_ref = getUserSettings(user_id)
    existing_doc = doc_ref.get()
    existing_data = existing_doc.to_dict() if existing_doc.exists else {}

    if "courses" in payload.model_fields_set:
        courses = normalize_courses(payload.courses)
    else:
        courses = normalize_courses(existing_data.get("courses"))

    if "availability" in payload.model_fields_set:
        availability = payload.availability.model_dump()
    else:
        availability = existing_data.get("availability", payload.availability.model_dump())

    # --- Audit timestamp ---
    updated_at = datetime.now(timezone.utc)

    # --- Final document to store in Firestore ---
    doc_data = {
        "calendarSync": payload.calendarSync.model_dump(),
        "email": payload.email.model_dump(),
        "reminders": payload.reminders.model_dump(),
        "two_way": payload.two_way.model_dump(),
        "courses": courses,
        "availability": availability,
        "updatedAt": updated_at,
    }

    # --- Write to Firestore ---
    # Single settings document approach
    doc_ref.set(doc_data)

    # --- Return serialized version ---
    return {
        "id": doc_ref.id,
        **{k: serialize_firestore_value(v) for k, v in doc_data.items()},
    }

# ----------------------------------------
# GET /settings
# Fetch the single settings document
# ----------------------------------------
@router.get("", response_model=SettingResponse)
def get_settings(current_user=Depends(get_current_user)):
    user_id = current_user["uid"]
    doc_ref = getUserSettings(user_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Settings document not found")

    return serialize_doc(doc)
