from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


PlanPriority = Literal["low", "medium", "high"]
SubtaskCategory = Literal["deep_work", "study", "admin"]


class AssignmentPlanCreate(BaseModel):
    courseName: str = Field(..., min_length=1, max_length=120)
    dueDate: datetime
    assignmentType: str = Field(..., min_length=1, max_length=80)
    priority: PlanPriority
    difficulty: int = Field(..., ge=1, le=3)
    requirements: str = Field(default="", max_length=12000)


class ClarificationQuestion(BaseModel):
    id: str = Field(..., min_length=1, max_length=60)
    question: str = Field(..., min_length=1, max_length=300)
    reason: str = Field(..., min_length=1, max_length=240)


class ClarificationResponse(BaseModel):
    questions: list[ClarificationQuestion] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def validate_unique_question_ids(self):
        question_ids = [question.id for question in self.questions]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("clarification question IDs must be unique")
        return self


class ClarificationAnswer(BaseModel):
    questionId: str = Field(..., min_length=1, max_length=60)
    answer: str = Field(..., min_length=1, max_length=4000)


class ClarificationAnswersCreate(BaseModel):
    answers: list[ClarificationAnswer] = Field(..., min_length=1, max_length=3)


class ClarificationAnswerCheckpoint(BaseModel):
    questionId: str = Field(..., min_length=1, max_length=60)
    answer: str = Field(default="", max_length=4000)


class ClarificationAnswersUpdate(BaseModel):
    revision: int = Field(..., ge=1)
    answers: list[ClarificationAnswerCheckpoint] = Field(default_factory=list, max_length=3)


class RevisionRequest(BaseModel):
    revision: int = Field(..., ge=1)


class GeneratedSubtask(BaseModel):
    id: str = Field(..., min_length=1, max_length=60)
    title: str = Field(..., min_length=1, max_length=160)
    description: str = Field(..., min_length=1, max_length=600)
    estimatedMinutes: int = Field(..., ge=15, le=1440)
    category: SubtaskCategory
    priority: PlanPriority
    dependencies: list[str] = Field(default_factory=list, max_length=10)
    splittable: bool = True
    minimumBlockMinutes: int = Field(default=30, ge=15, le=240)

    @model_validator(mode="after")
    def validate_minimum_block(self):
        if self.minimumBlockMinutes > self.estimatedMinutes:
            raise ValueError("minimumBlockMinutes cannot exceed estimatedMinutes")
        if self.id in self.dependencies:
            raise ValueError("a subtask cannot depend on itself")
        return self


class GeneratedDraft(BaseModel):
    summary: str = Field(..., min_length=1, max_length=800)
    assumptions: list[str] = Field(default_factory=list, max_length=10)
    subtasks: list[GeneratedSubtask] = Field(..., min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_dependency_graph(self):
        by_id = {task.id: task for task in self.subtasks}
        if len(by_id) != len(self.subtasks):
            raise ValueError("subtask IDs must be unique")

        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(task_id: str):
            if task_id in visiting:
                raise ValueError("subtask dependencies cannot contain a cycle")
            if task_id in visited:
                return
            task = by_id.get(task_id)
            if task is None:
                raise ValueError(f"unknown subtask dependency: {task_id}")
            visiting.add(task_id)
            for dependency_id in task.dependencies:
                visit(dependency_id)
            visiting.remove(task_id)
            visited.add(task_id)

        for task_id in by_id:
            visit(task_id)
        return self


class DraftUpdate(BaseModel):
    revision: int = Field(..., ge=1)
    draft: GeneratedDraft


class SchedulePolicy(BaseModel):
    allowOutsideWorkHours: bool = False
    additionalDailyMinutes: int = Field(default=0, ge=0, le=480)
    leaveUnscheduled: bool = False


class ScheduleRequest(BaseModel):
    revision: int = Field(..., ge=1)
    policy: SchedulePolicy = Field(default_factory=SchedulePolicy)
