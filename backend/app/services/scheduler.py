from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from models.assignment_plan import GeneratedSubtask, SchedulePolicy
from models.setting import AvailabilityConfig, AvailabilityWindow


@dataclass(frozen=True)
class BusyInterval:
    start: datetime
    end: datetime


@dataclass(frozen=True)
class ScheduledBlock:
    subtask_id: str
    title: str
    category: str
    priority: str
    start: datetime
    end: datetime
    estimated_minutes: int


@dataclass(frozen=True)
class ScheduleResult:
    blocks: list[ScheduledBlock]
    required_minutes: int
    available_minutes: int
    unscheduled_minutes: int

    @property
    def feasible(self) -> bool:
        return self.unscheduled_minutes == 0


WEEKDAY_NAMES = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)


def _parse_wall_time(value: str) -> time:
    return time.fromisoformat(value)


def _merge_intervals(intervals: list[BusyInterval]) -> list[BusyInterval]:
    merged: list[BusyInterval] = []
    for interval in sorted(intervals, key=lambda item: item.start):
        if interval.end <= interval.start:
            continue
        if merged and interval.start <= merged[-1].end:
            merged[-1] = BusyInterval(
                merged[-1].start,
                max(merged[-1].end, interval.end),
            )
        else:
            merged.append(interval)
    return merged


def _subtract_busy(
    window: BusyInterval,
    busy_intervals: list[BusyInterval],
) -> list[BusyInterval]:
    free = [window]
    for busy in busy_intervals:
        next_free: list[BusyInterval] = []
        for candidate in free:
            if busy.end <= candidate.start or busy.start >= candidate.end:
                next_free.append(candidate)
                continue
            if busy.start > candidate.start:
                next_free.append(BusyInterval(candidate.start, busy.start))
            if busy.end < candidate.end:
                next_free.append(BusyInterval(busy.end, candidate.end))
        free = next_free
    return free


def _candidate_windows(
    now: datetime,
    deadline: datetime,
    availability: AvailabilityConfig,
    busy_intervals: list[BusyInterval],
    policy: SchedulePolicy,
) -> list[BusyInterval]:
    try:
        user_tz = ZoneInfo(availability.timezone)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("Availability timezone is not a valid IANA timezone") from exc

    now_local = now.astimezone(user_tz)
    deadline_local = deadline.astimezone(user_tz)
    busy_utc = _merge_intervals(
        [
            BusyInterval(item.start.astimezone(timezone.utc), item.end.astimezone(timezone.utc))
            for item in busy_intervals
        ]
    )
    windows: list[BusyInterval] = []
    current_day: date = now_local.date()

    while current_day <= deadline_local.date():
        weekday = WEEKDAY_NAMES[current_day.weekday()]
        configured = getattr(availability.weekly, weekday)
        if policy.allowOutsideWorkHours:
            configured = [AvailabilityWindow(start="06:00", end="23:00")]

        daily_minutes = availability.maximumDailyMinutes + policy.additionalDailyMinutes
        daily_free: list[BusyInterval] = []
        for item in configured:
            start_local = datetime.combine(current_day, _parse_wall_time(item.start), user_tz)
            end_local = datetime.combine(current_day, _parse_wall_time(item.end), user_tz)
            start_utc = max(start_local.astimezone(timezone.utc), now.astimezone(timezone.utc))
            end_utc = min(end_local.astimezone(timezone.utc), deadline.astimezone(timezone.utc))
            if end_utc > start_utc:
                daily_free.extend(
                    _subtract_busy(BusyInterval(start_utc, end_utc), busy_utc)
                )

        # Daily capacity is applied after conflict subtraction so busy events do not
        # consume the student's configured study budget.
        remaining_daily = daily_minutes
        for interval in sorted(daily_free, key=lambda item: item.start):
            duration = int((interval.end - interval.start).total_seconds() // 60)
            usable = min(duration, remaining_daily)
            if usable >= availability.minimumBlockMinutes:
                windows.append(
                    BusyInterval(interval.start, interval.start + timedelta(minutes=usable))
                )
                remaining_daily -= usable
            if remaining_daily < availability.minimumBlockMinutes:
                break
        current_day += timedelta(days=1)

    return windows


def _ordered_subtasks(subtasks: list[GeneratedSubtask]) -> list[GeneratedSubtask]:
    by_id = {task.id: task for task in subtasks}
    if len(by_id) != len(subtasks):
        raise ValueError("Subtask IDs must be unique")

    ordered: list[GeneratedSubtask] = []
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(task: GeneratedSubtask):
        if task.id in visiting:
            raise ValueError("Subtask dependencies contain a cycle")
        if task.id in visited:
            return
        visiting.add(task.id)
        for dependency_id in task.dependencies:
            dependency = by_id.get(dependency_id)
            if dependency is None:
                raise ValueError(f"Unknown subtask dependency: {dependency_id}")
            visit(dependency)
        visiting.remove(task.id)
        visited.add(task.id)
        ordered.append(task)

    for task in subtasks:
        visit(task)
    return ordered


def build_schedule(
    subtasks: list[GeneratedSubtask],
    now: datetime,
    deadline: datetime,
    availability: AvailabilityConfig,
    busy_intervals: list[BusyInterval],
    strategy: str,
    policy: SchedulePolicy,
) -> ScheduleResult:
    if now.tzinfo is None or deadline.tzinfo is None:
        raise ValueError("Scheduler datetimes must include timezone information")
    if deadline <= now:
        raise ValueError("The deadline must be in the future")

    windows = _candidate_windows(now, deadline, availability, busy_intervals, policy)
    required = sum(task.estimatedMinutes for task in subtasks)
    available = sum(int((item.end - item.start).total_seconds() // 60) for item in windows)

    # Late strategy uses the smallest suffix of availability that can hold the work.
    # The selected suffix is put back in chronological order so dependencies remain valid.
    if strategy == "late" and windows:
        selected: list[BusyInterval] = []
        capacity = 0
        for window in reversed(windows):
            selected.append(window)
            capacity += int((window.end - window.start).total_seconds() // 60)
            if capacity >= required:
                break
        windows = sorted(selected, key=lambda item: item.start)

    blocks: list[ScheduledBlock] = []
    window_index = 0
    cursor = windows[0].start if windows else now
    unscheduled = 0

    for task in _ordered_subtasks(subtasks):
        remaining = task.estimatedMinutes
        while remaining > 0 and window_index < len(windows):
            window = windows[window_index]
            cursor = max(cursor, window.start)
            free_minutes = int((window.end - cursor).total_seconds() // 60)
            minimum = min(
                max(task.minimumBlockMinutes, availability.minimumBlockMinutes),
                remaining,
            )
            if free_minutes < minimum:
                window_index += 1
                if window_index < len(windows):
                    cursor = windows[window_index].start
                continue

            block_minutes = min(remaining, free_minutes, availability.maximumBlockMinutes)
            if not task.splittable and block_minutes < remaining:
                window_index += 1
                if window_index < len(windows):
                    cursor = windows[window_index].start
                continue

            remainder = remaining - block_minutes
            effective_minimum = max(
                task.minimumBlockMinutes,
                availability.minimumBlockMinutes,
            )
            if 0 < remainder < effective_minimum:
                adjusted = block_minutes - (effective_minimum - remainder)
                if adjusted >= effective_minimum:
                    block_minutes = adjusted
                else:
                    window_index += 1
                    if window_index < len(windows):
                        cursor = windows[window_index].start
                    continue

            block_end = cursor + timedelta(minutes=block_minutes)
            blocks.append(
                ScheduledBlock(
                    subtask_id=task.id,
                    title=task.title,
                    category=task.category,
                    priority=task.priority,
                    start=cursor,
                    end=block_end,
                    estimated_minutes=block_minutes,
                )
            )
            remaining -= block_minutes
            cursor = block_end + timedelta(minutes=availability.breakMinutes)
            if cursor >= window.end:
                window_index += 1
                if window_index < len(windows):
                    cursor = windows[window_index].start
        unscheduled += remaining

    return ScheduleResult(blocks, required, available, unscheduled)
