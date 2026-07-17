import os
from typing import Any

try:
    from google import genai
    from google.genai import types
except ImportError:
    # Local development can still exercise the complete workflow in template mode
    # before the optional Gemini dependency has been installed.
    genai = None
    types = None

from models.assignment_plan import (
    AssignmentPlanCreate,
    ClarificationQuestion,
    ClarificationResponse,
    GeneratedDraft,
    GeneratedSubtask,
)


def _client() -> Any | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    return genai.Client(api_key=api_key) if api_key and genai is not None else None


def _assignment_context(assignment: AssignmentPlanCreate) -> str:
    return f"""
Course: {assignment.courseName}
Type: {assignment.assignmentType}
Due: {assignment.dueDate.isoformat()}
Priority: {assignment.priority}
Difficulty: {assignment.difficulty}/3
Requirements: {assignment.requirements or "Not provided"}
""".strip()


def generate_clarification_questions(
    assignment: AssignmentPlanCreate,
) -> list[ClarificationQuestion]:
    client = _client()
    if client is None:
        # The fallback deliberately asks only questions that materially affect effort.
        if len(assignment.requirements.strip()) >= 80:
            return []
        return [
            ClarificationQuestion(
                id="deliverables",
                question="What exactly must you submit, including length or format?",
                reason="The deliverables determine the work phases and effort estimate.",
            ),
            ClarificationQuestion(
                id="rubric",
                question="Which rubric criteria or requirements carry the most weight?",
                reason="High-value criteria should receive more preparation and review time.",
            ),
            ClarificationQuestion(
                id="progress",
                question="What have you already completed, if anything?",
                reason="Completed work should not be scheduled again.",
            ),
        ]

    prompt = f"""
Review this assignment and ask only questions whose answers would materially change
the subtasks or effort estimate. Return no questions when the supplied requirements
are already sufficient. Never ask about calendar availability, because another part
of the application owns scheduling. Return at most three concise questions.

{_assignment_context(assignment)}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ClarificationResponse,
            system_instruction=(
                "You identify missing assignment context. You do not create schedules "
                "or ask questions that do not affect the work breakdown."
            ),
        ),
    )
    parsed = response.parsed
    if not isinstance(parsed, ClarificationResponse):
        raise ValueError("Gemini did not return valid clarification questions")
    # Enforce the product limit in application code even if the model ignores the prompt.
    return parsed.questions[:3]


def _mock_draft(assignment: AssignmentPlanCreate) -> GeneratedDraft:
    type_name = assignment.assignmentType.lower()
    if "lab" in type_name:
        phases = [
            ("Organize observations and calculations", "study", 90),
            ("Draft methods and results", "deep_work", 150),
            ("Write analysis and conclusion", "deep_work", 120),
            ("Check figures, citations, and formatting", "admin", 60),
        ]
    elif "discussion" in type_name:
        phases = [
            ("Review the prompt and course material", "study", 45),
            ("Draft the response and supporting examples", "deep_work", 60),
            ("Revise and prepare the final post", "admin", 30),
        ]
    else:
        phases = [
            ("Analyze requirements and gather sources", "study", 120),
            ("Build the structure and central argument", "deep_work", 90),
            ("Draft the core deliverable", "deep_work", 180),
            ("Revise against requirements", "admin", 90),
        ]

    difficulty_multiplier = {1: 0.8, 2: 1.0, 3: 1.3}[assignment.difficulty]
    subtasks: list[GeneratedSubtask] = []
    for index, (title, category, minutes) in enumerate(phases, start=1):
        task_id = f"task-{index}"
        estimate = max(30, int(minutes * difficulty_multiplier / 15) * 15)
        subtasks.append(
            GeneratedSubtask(
                id=task_id,
                title=title,
                description=f"Complete this phase for the {assignment.assignmentType.lower()}.",
                estimatedMinutes=estimate,
                category=category,
                priority=assignment.priority if index < len(phases) else "medium",
                dependencies=[f"task-{index - 1}"] if index > 1 else [],
                splittable=estimate > 60,
                minimumBlockMinutes=30,
            )
        )
    return GeneratedDraft(
        summary=f"A staged plan for the {assignment.assignmentType.lower()} in {assignment.courseName}.",
        assumptions=[
            "Effort estimates are provisional and must be confirmed before scheduling.",
            "The submitted description and clarification answers represent the full scope.",
        ],
        subtasks=subtasks,
    )


def generate_subtask_draft(
    assignment: AssignmentPlanCreate,
    answers: list[dict[str, Any]],
) -> GeneratedDraft:
    client = _client()
    if client is None:
        return _mock_draft(assignment)

    answers_text = "\n".join(
        f"- {answer.get('question', answer.get('questionId'))}: {answer.get('answer')}"
        for answer in answers
    ) or "No clarification was needed."
    prompt = f"""
Decompose this assignment into concrete, outcome-oriented subtasks. Estimate realistic
effort, but do not choose dates or times. The student will review every estimate before
the deterministic scheduler runs. Dependencies must reference earlier subtask IDs.
Use stable IDs task-1, task-2, and so on. Keep blocks splittable unless uninterrupted
work is genuinely required, and use 15-minute increments.

{_assignment_context(assignment)}

Clarification answers:
{answers_text}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeneratedDraft,
            system_instruction=(
                "You are an academic work-breakdown specialist. You estimate and "
                "sequence work, but never generate calendar timestamps."
            ),
        ),
    )
    parsed = response.parsed
    if not isinstance(parsed, GeneratedDraft):
        raise ValueError("Gemini did not return a valid subtask draft")
    return parsed
