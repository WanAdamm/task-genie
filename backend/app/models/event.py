from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ----------------------------------------
# ENUM-LIKE TYPE DEFINITIONS
# Restrict allowed values for validation
# ----------------------------------------

# Event category used for UI grouping / filtering
Category = Literal[
    "deep_work",
    "lecture",
    "deadline",
    "study",
    "meeting",
    "exam",
    "personal",
    "break",
    "admin",
]

# Lifecycle status of an event
Status = Literal[
    "scheduled",
    "completed",
    "missed",
    "cancelled",
    "rescheduled",
    "conflicted",
]

# Source of event creation (manual, AI, sync, etc.)
Source = Literal[
    "manual",
    "ai_generated",
    "google_synced",
    "internal",
]

# Priority level (used for sorting / UI emphasis)
Priority = Literal["low", "medium", "high"]


# ----------------------------------------
# NESTED MODELS
# Used to structure complex fields
# ----------------------------------------

class ConflictInfo(BaseModel):
    # Whether this event overlaps/conflicts with another
    hasConflict: bool = False

    # Optional explanation (e.g. "Overlaps with Lecture")
    reason: Optional[str] = None


class EventMeta(BaseModel):
    # Estimated effort (used by planner / AI logic)
    estimatedMinutes: int = Field(..., ge=0)

    # Actual time spent (for analytics later)
    actualMinutes: int = Field(default=0, ge=0)


# ----------------------------------------
# INPUT MODEL (POST /events)
# Defines what the client is allowed to send
# ----------------------------------------

class EventCreate(BaseModel):
    # Event title shown in calendar
    title: str = Field(..., min_length=1, max_length=200)

    # Category must match predefined set
    category: Category

    # Which calendar this event belongs to
    calendarId: str = Field(..., min_length=1)

    # Start and end time (parsed into datetime automatically)
    start: datetime
    end: datetime

    # Defaults applied if not provided
    status: Status = "scheduled"
    priority: Priority = "medium"
    source: Source = "manual"

    # Prevent event from being moved by scheduler
    isLocked: bool = False

    # Link to assignment (optional, for AI planner integration)
    assignmentId: Optional[str] = None

    # Conflict info (defaults to no conflict)
    conflict: ConflictInfo = ConflictInfo()

    # Metadata (required)
    meta: EventMeta


# ----------------------------------------
# OUTPUT MODEL (API RESPONSE)
# Defines what the backend returns
# ----------------------------------------

class EventResponse(BaseModel):
    # Firestore document ID
    id: str

    # Core event info
    title: str
    category: str
    calendarId: str

    # ISO string timestamps (frontend-friendly)
    start: str
    end: str

    # Precomputed keys for efficient querying
    dateKey: str      # e.g. "2026-04-20"
    yearMonth: str    # e.g. "2026-04"
    weekKey: str      # e.g. "2026-W17"

    # Status & classification
    status: str
    priority: str
    source: str

    # Locking and linking
    isLocked: bool
    assignmentId: Optional[str] = None

    # Nested structures
    conflict: ConflictInfo
    meta: EventMeta

    # Audit timestamps (ISO strings)
    createdAt: str
    updatedAt: str