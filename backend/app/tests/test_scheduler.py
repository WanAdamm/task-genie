import unittest
from datetime import datetime, timedelta, timezone

from models.assignment_plan import GeneratedSubtask, SchedulePolicy
from models.setting import (
    AvailabilityConfig,
    AvailabilityWindow,
    WeeklyAvailability,
)
from services.scheduler import BusyInterval, build_schedule


def availability(**days):
    weekly = WeeklyAvailability(
        **{
            day: [AvailabilityWindow(start=start, end=end)]
            for day, (start, end) in days.items()
        }
    )
    return AvailabilityConfig(
        timezone="UTC",
        weekly=weekly,
        minimumBlockMinutes=30,
        maximumBlockMinutes=120,
        breakMinutes=0,
        maximumDailyMinutes=480,
    )


def task(task_id, minutes, dependencies=None, splittable=True):
    return GeneratedSubtask(
        id=task_id,
        title=task_id,
        description=f"Complete {task_id}",
        estimatedMinutes=minutes,
        category="deep_work",
        priority="medium",
        dependencies=dependencies or [],
        splittable=splittable,
        minimumBlockMinutes=30,
    )


class SchedulerTests(unittest.TestCase):
    def test_subtracts_existing_calendar_events(self):
        now = datetime(2026, 7, 20, 8, tzinfo=timezone.utc)  # Monday
        result = build_schedule(
            subtasks=[task("draft", 60)],
            now=now,
            deadline=now + timedelta(days=1),
            availability=availability(monday=("09:00", "13:00")),
            busy_intervals=[
                BusyInterval(
                    datetime(2026, 7, 20, 9, tzinfo=timezone.utc),
                    datetime(2026, 7, 20, 10, tzinfo=timezone.utc),
                )
            ],
            strategy="early",
            policy=SchedulePolicy(),
        )

        self.assertTrue(result.feasible)
        self.assertEqual(result.blocks[0].start.hour, 10)

    def test_dependency_order_is_preserved(self):
        now = datetime(2026, 7, 20, 8, tzinfo=timezone.utc)
        result = build_schedule(
            subtasks=[task("write", 60, ["research"]), task("research", 60)],
            now=now,
            deadline=now + timedelta(days=1),
            availability=availability(monday=("09:00", "13:00")),
            busy_intervals=[],
            strategy="early",
            policy=SchedulePolicy(),
        )

        self.assertEqual([block.subtask_id for block in result.blocks], ["research", "write"])

    def test_reports_work_that_cannot_fit(self):
        now = datetime(2026, 7, 20, 8, tzinfo=timezone.utc)
        result = build_schedule(
            subtasks=[task("large-task", 180)],
            now=now,
            deadline=now + timedelta(hours=4),
            availability=availability(monday=("09:00", "10:00")),
            busy_intervals=[],
            strategy="balanced",
            policy=SchedulePolicy(),
        )

        self.assertFalse(result.feasible)
        self.assertEqual(result.unscheduled_minutes, 120)


if __name__ == "__main__":
    unittest.main()
