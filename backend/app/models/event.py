from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


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

Status = Literal[
    "scheduled",
    "completed",
    "missed",
    "cancelled",
    "rescheduled",
    "conflicted",
]

Source = Literal[
    "manual",
    "ai_generated",
    "google_synced",
    "internal",
]

Priority = Literal["low", "medium", "high"]


class ConflictInfo(BaseModel):
    hasConflict: bool = False
    reason: Optional[str] = None


class EventMeta(BaseModel):
    estimatedMinutes: int = Field(..., ge=0)
    actualMinutes: int = Field(default=0, ge=0)


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: Category
    calendarId: str = Field(..., min_length=1)
    start: datetime
    end: datetime
    status: Status = "scheduled"
    priority: Priority = "medium"
    source: Source = "manual"
    isLocked: bool = False
    assignmentId: Optional[str] = None
    conflict: ConflictInfo = ConflictInfo()
    meta: EventMeta


class EventResponse(BaseModel):
    id: str
    title: str
    category: str
    calendarId: str
    start: str
    end: str
    dateKey: str
    yearMonth: str
    weekKey: str
    status: str
    priority: str
    source: str
    isLocked: bool
    assignmentId: Optional[str] = None
    conflict: ConflictInfo
    meta: EventMeta
    createdAt: str
    updatedAt: str