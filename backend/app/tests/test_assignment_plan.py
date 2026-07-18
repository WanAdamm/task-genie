import unittest
from datetime import datetime, timedelta, timezone

from models.assignment_plan import (
    AssignmentPlanCreate,
    ClarificationQuestion,
    ClarificationResponse,
    MAX_ASSIGNMENT_REQUIREMENTS_CHARS,
)
from pydantic import ValidationError
from routes.assignment_plans import _plan_response


def plan_data(due_date: datetime):
    now = datetime.now(timezone.utc)
    return {
        "assignment": {
            "courseName": "Test Course",
            "dueDate": due_date.isoformat(),
            "assignmentType": "Essay",
            "priority": "medium",
            "difficulty": 2,
            "requirements": "Test requirements",
        },
        "questions": [],
        "answers": [],
        "revision": 1,
        "status": "draft",
        "createdAt": now,
        "updatedAt": now,
    }


class AssignmentPlanTests(unittest.TestCase):
    def test_projects_overdue_unfinished_plan_as_expired(self):
        response = _plan_response(
            "plan-1",
            plan_data(datetime.now(timezone.utc) - timedelta(minutes=1)),
        )

        self.assertEqual(response["status"], "expired")

    def test_preserves_status_for_future_plan(self):
        response = _plan_response(
            "plan-1",
            plan_data(datetime.now(timezone.utc) + timedelta(days=1)),
        )

        self.assertEqual(response["status"], "draft")

    def test_rejects_duplicate_clarification_question_ids(self):
        question = ClarificationQuestion(
            id="scope",
            question="What is the scope?",
            reason="Scope affects the estimate.",
        )

        with self.assertRaises(ValidationError):
            ClarificationResponse(questions=[question, question])

    def test_allows_bounded_multi_document_requirements(self):
        assignment = AssignmentPlanCreate(
            courseName="Test Course",
            dueDate=datetime.now(timezone.utc) + timedelta(days=1),
            assignmentType="Essay",
            priority="medium",
            difficulty=2,
            requirements="a" * MAX_ASSIGNMENT_REQUIREMENTS_CHARS,
        )

        self.assertEqual(len(assignment.requirements), MAX_ASSIGNMENT_REQUIREMENTS_CHARS)

    def test_rejects_requirements_above_document_limit(self):
        with self.assertRaises(ValidationError):
            AssignmentPlanCreate(
                courseName="Test Course",
                dueDate=datetime.now(timezone.utc) + timedelta(days=1),
                assignmentType="Essay",
                priority="medium",
                difficulty=2,
                requirements="a" * (MAX_ASSIGNMENT_REQUIREMENTS_CHARS + 1),
            )


if __name__ == "__main__":
    unittest.main()
