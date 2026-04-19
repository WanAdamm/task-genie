from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# ----------------------------------------
# ENUM-LIKE TYPE DEFINITIONS
# Restrict allowed values for validation
# ----------------------------------------

# Determines how calendar sync behaves (read/write permissions)
SyncMode = Literal[
    "two_way", 
    "one_way",
    "manual",
]

# Strategy for scheduling tasks
TaskDifficultyStrategy = Literal[
    "early",
    "balanced",
    "late",
]

# ----------------------------------------
# NESTED MODELS
# Used to structure complex fields
# ----------------------------------------

class GoogleCalendar(BaseModel):
    # Whether user has connected Google Calendar
    connected: bool = False

    # Fixed provider (future-proof if adding Outlook, etc.)
    provider: Literal["google"] = "google"

    # Whether sync is enabled
    syncEnabled: bool = False

    # Sync mode (controls write behavior)
    syncMode: SyncMode = "two_way"


class CalendarSync(BaseModel):
    # Container for multiple calendar providers
    googleCalendar: GoogleCalendar = Field(default_factory=GoogleCalendar)


class EmailConfig(BaseModel):
    # Daily summary email
    dailyDigest: bool = False

    # Alert when deadline is near
    deadlineAlerts: bool = True

    # Weekly performance/report email
    weeklyReport: bool = False


class RemindersConfig(BaseModel):
    # Primary alert (closer to deadline)
    primaryAlertDays: int = Field(14, ge=1)

    # Secondary alert (earlier warning)
    secondaryAlertDays: int = Field(21, ge=1)

    # Ensure logical ordering: secondary > primary
    @model_validator(mode="after")
    def validate_alert_order(self):
        if self.secondaryAlertDays <= self.primaryAlertDays:
            raise ValueError(
                "secondaryAlertDays must be greater than primaryAlertDays"
            )
        return self


class TwoWayConfig(BaseModel):
    # AI confidence level (controls aggressiveness of scheduling)
    confidenceLevel: int = Field(3, ge=1, le=5)

    # Strategy for distributing workload
    taskDifficultyStrategy: TaskDifficultyStrategy = "balanced"


# ----------------------------------------
# INPUT MODEL (POST /settings)
# Defines what the client is allowed to send
# ----------------------------------------

class SettingCreate(BaseModel):
    # Timestamp when settings are updated
    updatedAt: datetime = Field(default_factory=datetime.now)

    # Nested configs (use default_factory to avoid shared state)
    calendarSync: CalendarSync = Field(default_factory=CalendarSync)
    email: EmailConfig = Field(default_factory=EmailConfig)
    reminders: RemindersConfig = Field(default_factory=RemindersConfig)
    two_way: TwoWayConfig = Field(default_factory=TwoWayConfig)


# ----------------------------------------
# OUTPUT MODEL (API RESPONSE)
# Defines what the backend returns
# ----------------------------------------

class SettingResponse(BaseModel):
    # Always use datetime internally; FastAPI handles serialization
    updatedAt: datetime

    calendarSync: CalendarSync
    email: EmailConfig
    reminders: RemindersConfig
    two_way: TwoWayConfig