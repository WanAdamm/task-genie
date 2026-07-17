from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

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


class AvailabilityWindow(BaseModel):
    start: str
    end: str

    @model_validator(mode="after")
    def validate_window(self):
        try:
            start_parts = [int(part) for part in self.start.split(":")]
            end_parts = [int(part) for part in self.end.split(":")]
        except ValueError as exc:
            raise ValueError("availability times must use HH:MM") from exc
        if len(start_parts) != 2 or len(end_parts) != 2:
            raise ValueError("availability times must use HH:MM")
        if not (0 <= start_parts[0] <= 23 and 0 <= start_parts[1] <= 59):
            raise ValueError("availability start is invalid")
        if not (0 <= end_parts[0] <= 23 and 0 <= end_parts[1] <= 59):
            raise ValueError("availability end is invalid")
        if end_parts <= start_parts:
            raise ValueError("availability end must be later than start")
        return self


class WeeklyAvailability(BaseModel):
    # The settings UI intentionally exposes one predictable study window per day.
    # Keeping the API contract identical prevents a later save from flattening data.
    monday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    tuesday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    wednesday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    thursday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    friday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    saturday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)
    sunday: list[AvailabilityWindow] = Field(default_factory=list, max_length=1)


class AvailabilityConfig(BaseModel):
    timezone: str = "UTC"
    weekly: WeeklyAvailability = Field(default_factory=WeeklyAvailability)
    minimumBlockMinutes: int = Field(default=30, ge=15, le=120)
    maximumBlockMinutes: int = Field(default=120, ge=30, le=360)
    breakMinutes: int = Field(default=10, ge=0, le=60)
    maximumDailyMinutes: int = Field(default=360, ge=30, le=960)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("timezone must be a valid IANA timezone") from exc
        return value

    @model_validator(mode="after")
    def validate_block_range(self):
        if self.maximumBlockMinutes < self.minimumBlockMinutes:
            raise ValueError("maximumBlockMinutes must be at least minimumBlockMinutes")
        return self


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
    courses: list[str] = Field(default_factory=list)
    availability: AvailabilityConfig = Field(default_factory=AvailabilityConfig)


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
    courses: list[str] = Field(default_factory=list)
    availability: AvailabilityConfig = Field(default_factory=AvailabilityConfig)
