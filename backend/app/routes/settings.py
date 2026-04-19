from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from app.models.setting import SettingResponse, SettingCreate
from app.services.firestore import getSettings

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

# ----------------------------------------
# POST /settings
# Create or replace app settings
# ----------------------------------------
@router.post("/")
def create_settings(payload: SettingCreate):
    # --- Audit timestamp ---
    updated_at = datetime.now(timezone.utc)

    # --- Final document to store in Firestore ---
    doc_data = {
        "calendarSync": payload.calendarSync.model_dump(),
        "email": payload.email.model_dump(),
        "reminders": payload.reminders.model_dump(),
        "two_way": payload.two_way.model_dump(),
        "updatedAt": updated_at,
    }

    # --- Write to Firestore ---
    # Single settings document approach
    doc_ref = getSettings()
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
@router.get("/", response_model=SettingResponse)
def get_settings():
    doc_ref = getSettings()
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Settings document not found")

    return serialize_doc(doc)