import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore

from models.assignment_plan import (
    AssignmentPlanCreate,
    ClarificationAnswersUpdate,
    DraftUpdate,
    GeneratedDraft,
    RevisionRequest,
    ScheduleRequest,
)
from models.setting import AvailabilityConfig
from services.auth import get_current_user
from services.firestore import (
    get_firestore_client,
    get_user_assignment_plans_collection,
    get_user_events_collection,
    getUserSettings,
)
from services.llm_planner import (
    generate_clarification_questions,
    generate_subtask_draft,
)
from services.scheduler import BusyInterval, ScheduleResult, build_schedule


router = APIRouter()
logger = logging.getLogger(__name__)


def _serialize(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    return value


def _plan_or_404(user_id: str, plan_id: str):
    ref = get_user_assignment_plans_collection(user_id).document(plan_id)
    snapshot = ref.get()
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Assignment plan not found")
    return ref, snapshot.to_dict()


def _plan_response(plan_id: str, data: dict):
    response = {"planId": plan_id, **_serialize(data)}
    if data.get("status") in {"awaiting_answers", "draft", "preview"}:
        due_date = AssignmentPlanCreate.model_validate(data["assignment"]).dueDate
        if due_date <= datetime.now(timezone.utc):
            response["status"] = "expired"
    return response


def _ensure_plan_not_expired(data: dict):
    due_date = AssignmentPlanCreate.model_validate(data["assignment"]).dueDate
    if due_date <= datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="This assignment deadline has passed.")


def _availability_and_strategy(user_id: str):
    snapshot = getUserSettings(user_id).get()
    data = snapshot.to_dict() if snapshot.exists else {}
    availability = AvailabilityConfig.model_validate(data.get("availability", {}))
    strategy = data.get("two_way", {}).get("taskDifficultyStrategy", "balanced")
    has_work_hours = any(
        getattr(availability.weekly, weekday)
        for weekday in availability.weekly.model_fields
    )
    return availability, strategy, has_work_hours


def _busy_intervals(user_id: str, timezone_name: str) -> list[BusyInterval]:
    user_timezone = ZoneInfo(timezone_name)
    intervals: list[BusyInterval] = []
    for document in get_user_events_collection(user_id).stream():
        data = document.to_dict()
        if data.get("status") in {"cancelled", "missed"} or data.get("category") == "deadline":
            continue
        start = data.get("startTs") or data.get("start")
        end = data.get("endTs") or data.get("end")
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", "+00:00"))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace("Z", "+00:00"))
        if not isinstance(start, datetime) or not isinstance(end, datetime):
            continue
        # Older events were saved without offsets; interpret them in the user's zone
        # instead of allowing the server's local timezone to change their meaning.
        if start.tzinfo is None:
            start = start.replace(tzinfo=user_timezone)
        if end.tzinfo is None:
            end = end.replace(tzinfo=user_timezone)
        intervals.append(BusyInterval(start, end))
    return intervals


def _schedule_response(result: ScheduleResult):
    proposed_events = [
        {
            "subtaskId": block.subtask_id,
            "title": block.title,
            "category": block.category,
            "priority": block.priority,
            "start": block.start.isoformat(),
            "end": block.end.isoformat(),
            "estimatedMinutes": block.estimated_minutes,
        }
        for block in result.blocks
    ]
    if result.feasible:
        return {
            "status": "ready",
            "requiredMinutes": result.required_minutes,
            "availableMinutes": result.available_minutes,
            "proposedEvents": proposed_events,
        }
    return {
        "status": "infeasible",
        "requiredMinutes": result.required_minutes,
        "availableMinutes": result.available_minutes,
        "unscheduledMinutes": result.unscheduled_minutes,
        "proposedEvents": proposed_events,
        "options": [
            {
                "id": "outside_work_hours",
                "label": "Use extended hours",
                "description": "Allow scheduling between 06:00 and 23:00.",
            },
            {
                "id": "increase_daily_limit",
                "label": "Add two hours per day",
                "description": "Temporarily increase daily study capacity by 120 minutes.",
            },
            {
                "id": "leave_unscheduled",
                "label": "Schedule what fits",
                "description": "Create the feasible blocks and leave the remaining work unscheduled.",
            },
            {
                "id": "edit_draft",
                "label": "Revise estimates",
                "description": "Return to the draft and change scope or effort estimates.",
            },
        ],
    }


def _run_schedule(user_id: str, data: dict, request: ScheduleRequest):
    if request.revision != data.get("revision"):
        raise HTTPException(status_code=409, detail="The plan changed. Reload the latest draft.")
    if data.get("status") not in {"draft", "preview"} or "draft" not in data:
        raise HTTPException(status_code=409, detail="The plan does not have a confirmed draft yet.")
    assignment = AssignmentPlanCreate.model_validate(data["assignment"])
    if assignment.dueDate <= datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="This assignment deadline has passed.")
    availability, strategy, has_work_hours = _availability_and_strategy(user_id)
    if not has_work_hours:
        return None, {
            "status": "needs_availability",
            "message": "Set at least one work-hour window before scheduling.",
        }
    draft = GeneratedDraft.model_validate(data["draft"])
    result = build_schedule(
        subtasks=draft.subtasks,
        now=datetime.now(timezone.utc),
        deadline=assignment.dueDate,
        availability=availability,
        busy_intervals=_busy_intervals(user_id, availability.timezone),
        strategy=strategy,
        policy=request.policy,
    )
    return result, _schedule_response(result)


@router.post("")
def create_assignment_plan(
    payload: AssignmentPlanCreate,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    if payload.dueDate.tzinfo is None:
        raise HTTPException(status_code=400, detail="dueDate must include a timezone offset")
    if payload.dueDate <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="dueDate must be in the future")

    try:
        questions = generate_clarification_questions(payload)
    except Exception as error:
        logger.exception("Gemini clarification generation failed")
        raise HTTPException(
            status_code=502,
            detail="Gemini could not analyze the assignment. Try again shortly.",
        ) from error
    plan_ref = get_user_assignment_plans_collection(user_id).document()
    now = datetime.now(timezone.utc)
    plan_data = {
        "assignment": payload.model_dump(mode="json"),
        "questions": [question.model_dump() for question in questions],
        "answers": [],
        "revision": 1,
        "status": "awaiting_answers" if questions else "draft",
        "createdAt": now,
        "updatedAt": now,
    }
    if not questions:
        try:
            plan_data["draft"] = generate_subtask_draft(payload, []).model_dump()
        except Exception as error:
            logger.exception("Gemini draft generation failed")
            raise HTTPException(
                status_code=502,
                detail="Gemini could not generate the assignment draft. Try again shortly.",
            ) from error
    plan_ref.set(plan_data)
    return _plan_response(plan_ref.id, plan_data)


@router.get("")
def list_assignment_plans(current_user=Depends(get_current_user)):
    user_id = current_user["uid"]
    items = []
    for snapshot in get_user_assignment_plans_collection(user_id).stream():
        data = snapshot.to_dict()
        if data.get("status") in {"scheduled", "cancelled"}:
            continue
        detail = _plan_response(snapshot.id, data)
        assignment = detail.get("assignment", {})
        items.append({
            "planId": snapshot.id,
            "status": detail.get("status"),
            "revision": detail.get("revision"),
            "courseName": assignment.get("courseName"),
            "assignmentType": assignment.get("assignmentType"),
            "dueDate": assignment.get("dueDate"),
            "createdAt": detail.get("createdAt"),
            "updatedAt": detail.get("updatedAt"),
        })
    items.sort(key=lambda item: item.get("updatedAt") or "", reverse=True)
    return {"items": items}


@router.get("/{plan_id}")
def get_assignment_plan(
    plan_id: str,
    current_user=Depends(get_current_user),
):
    _, data = _plan_or_404(current_user["uid"], plan_id)
    return _plan_response(plan_id, data)


@router.put("/{plan_id}/answers")
def checkpoint_answers(
    plan_id: str,
    payload: ClarificationAnswersUpdate,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    ref, data = _plan_or_404(user_id, plan_id)
    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_answers(current_transaction):
        latest = ref.get(transaction=current_transaction).to_dict()
        if latest.get("status") != "awaiting_answers":
            raise HTTPException(status_code=409, detail="This plan is not awaiting answers")
        _ensure_plan_not_expired(latest)
        if payload.revision != latest.get("revision"):
            raise HTTPException(status_code=409, detail="The plan changed. Reload its latest answers.")
        questions = {item["id"]: item for item in latest.get("questions", [])}
        submitted_ids = [answer.questionId for answer in payload.answers]
        if len(submitted_ids) != len(set(submitted_ids)):
            raise HTTPException(status_code=400, detail="Answer IDs must be unique")
        answers = []
        for answer in payload.answers:
            question = questions.get(answer.questionId)
            if question is None:
                raise HTTPException(status_code=400, detail=f"Unknown question: {answer.questionId}")
            answers.append({
                **answer.model_dump(),
                "question": question["question"],
            })
        update = {
            "answers": answers,
            "revision": payload.revision + 1,
            "updatedAt": datetime.now(timezone.utc),
        }
        current_transaction.update(ref, update)
        return update

    update = commit_answers(transaction)
    return _plan_response(plan_id, {**data, **update})


@router.post("/{plan_id}/generate-draft")
def generate_plan_draft(
    plan_id: str,
    payload: RevisionRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    ref, data = _plan_or_404(user_id, plan_id)
    if data.get("status") != "awaiting_answers":
        raise HTTPException(status_code=409, detail="This plan is not awaiting answers")
    _ensure_plan_not_expired(data)
    if payload.revision != data.get("revision"):
        raise HTTPException(status_code=409, detail="The plan changed. Reload its latest answers.")

    questions = {item["id"] for item in data.get("questions", [])}
    saved_answers = data.get("answers", [])
    answered_ids = {
        item.get("questionId")
        for item in saved_answers
        if isinstance(item.get("answer"), str) and item["answer"].strip()
    }
    if answered_ids != questions:
        raise HTTPException(status_code=400, detail="Answer each clarification question first")

    assignment = AssignmentPlanCreate.model_validate(data["assignment"])
    try:
        draft = generate_subtask_draft(assignment, saved_answers)
    except Exception as error:
        logger.exception("Gemini draft generation failed for plan %s", plan_id)
        raise HTTPException(
            status_code=502,
            detail="Gemini could not generate the assignment draft. Retry shortly.",
        ) from error

    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_generated_draft(current_transaction):
        latest = ref.get(transaction=current_transaction).to_dict()
        if latest.get("status") != "awaiting_answers" or latest.get("revision") != payload.revision:
            raise HTTPException(status_code=409, detail="The plan changed during generation. Reload it.")
        _ensure_plan_not_expired(latest)
        update = {
            "draft": draft.model_dump(),
            "status": "draft",
            "revision": payload.revision + 1,
            "updatedAt": datetime.now(timezone.utc),
        }
        current_transaction.update(ref, update)
        return update

    update = commit_generated_draft(transaction)
    return _plan_response(plan_id, {**data, **update})


@router.put("/{plan_id}/draft")
def update_draft(
    plan_id: str,
    payload: DraftUpdate,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    ref, _ = _plan_or_404(user_id, plan_id)
    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_draft_update(current_transaction):
        latest = ref.get(transaction=current_transaction).to_dict()
        if latest.get("status") not in {"draft", "preview"}:
            raise HTTPException(
                status_code=409,
                detail="Only draft plans can be edited.",
            )
        _ensure_plan_not_expired(latest)
        if payload.revision != latest.get("revision"):
            raise HTTPException(
                status_code=409,
                detail="The plan changed. Reload the latest draft.",
            )
        update = {
            "draft": payload.draft.model_dump(),
            "revision": payload.revision + 1,
            "status": "draft",
            "updatedAt": datetime.now(timezone.utc),
        }
        current_transaction.update(ref, update)
        return update

    update = commit_draft_update(transaction)
    return {"planId": plan_id, **_serialize(update)}


@router.post("/{plan_id}/preview")
def preview_schedule(
    plan_id: str,
    payload: ScheduleRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    ref, data = _plan_or_404(user_id, plan_id)
    _, response = _run_schedule(user_id, data, payload)
    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_preview_state(current_transaction):
        latest = ref.get(transaction=current_transaction).to_dict()
        if latest.get("revision") != payload.revision:
            raise HTTPException(status_code=409, detail="The plan changed during preview. Reload it.")
        if latest.get("status") not in {"draft", "preview"}:
            raise HTTPException(status_code=409, detail="This plan can no longer be previewed.")
        _ensure_plan_not_expired(latest)
        policy = payload.policy.model_dump()
        policy_changed = latest.get("status") != "preview" or latest.get("policy") != policy
        next_revision = payload.revision + 1 if policy_changed else payload.revision
        current_transaction.update(ref, {
            "status": "preview",
            "policy": policy,
            "revision": next_revision,
            "updatedAt": datetime.now(timezone.utc),
        })
        return next_revision

    next_revision = commit_preview_state(transaction)
    return {**response, "revision": next_revision}


@router.post("/{plan_id}/cancel")
def cancel_assignment_plan(
    plan_id: str,
    payload: RevisionRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    ref, _ = _plan_or_404(user_id, plan_id)
    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_cancellation(current_transaction):
        latest = ref.get(transaction=current_transaction).to_dict()
        if latest.get("status") == "cancelled":
            return latest
        if latest.get("status") == "scheduled":
            raise HTTPException(status_code=409, detail="Scheduled plans cannot be discarded.")
        if latest.get("revision") != payload.revision:
            raise HTTPException(status_code=409, detail="The plan changed. Reload before discarding it.")
        now = datetime.now(timezone.utc)
        update = {
            "status": "cancelled",
            "revision": payload.revision + 1,
            "cancelledAt": now,
            "updatedAt": now,
        }
        current_transaction.update(ref, update)
        return {**latest, **update}

    cancelled = commit_cancellation(transaction)
    return _plan_response(plan_id, cancelled)


@router.post("/{plan_id}/confirm")
def confirm_schedule(
    plan_id: str,
    payload: ScheduleRequest,
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    plan_ref, data = _plan_or_404(user_id, plan_id)
    if data.get("status") == "scheduled":
        return {"status": "scheduled", "events": data.get("events", [])}

    # Availability is intentionally re-read here because the calendar may have
    # changed after preview. Preview is advisory; confirmation is authoritative.
    result, response = _run_schedule(user_id, data, payload)
    if result is None:
        return response
    if not result.feasible and not payload.policy.leaveUnscheduled:
        return response

    assignment = AssignmentPlanCreate.model_validate(data["assignment"])
    if len(result.blocks) > 450:
        raise HTTPException(
            status_code=400,
            detail="The plan creates too many calendar blocks. Increase block lengths or reduce scope.",
        )

    now = datetime.now(timezone.utc)
    events_collection = get_user_events_collection(user_id)
    availability, _, _ = _availability_and_strategy(user_id)
    calendar_timezone = ZoneInfo(availability.timezone)
    serialized_events = []

    event_writes = []
    for index, block in enumerate(result.blocks):
        # Deterministic IDs make a retried confirmation overwrite the same blocks
        # rather than producing duplicates after a network or transaction retry.
        event_ref = events_collection.document(f"{plan_id}_block_{index:03d}")
        local_start = block.start.astimezone(calendar_timezone)
        iso_year, iso_week, _ = local_start.isocalendar()
        event_data = {
            "title": f"[{assignment.courseName}] {block.title}",
            "category": block.category,
            "calendarId": "primary",
            "start": block.start.isoformat(),
            "end": block.end.isoformat(),
            "startTs": block.start,
            "endTs": block.end,
            "dateKey": local_start.strftime("%Y-%m-%d"),
            "yearMonth": local_start.strftime("%Y-%m"),
            "weekKey": f"{iso_year}-W{iso_week:02d}",
            "status": "scheduled",
            "priority": block.priority,
            "source": "ai_generated",
            "isLocked": False,
            "assignmentId": plan_id,
            "planId": plan_id,
            "subtaskId": block.subtask_id,
            "conflict": {"hasConflict": False, "reason": None},
            "meta": {"estimatedMinutes": block.estimated_minutes, "actualMinutes": 0},
            "createdAt": now,
            "updatedAt": now,
        }
        event_writes.append((event_ref, event_data))
        serialized_events.append({"id": event_ref.id, **_serialize(event_data)})

    deadline_ref = events_collection.document(f"{plan_id}_deadline")
    deadline_end = assignment.dueDate + timedelta(minutes=15)
    local_deadline = assignment.dueDate.astimezone(calendar_timezone)
    iso_year, iso_week, _ = local_deadline.isocalendar()
    deadline_data = {
        "title": f"[{assignment.courseName}] Final submission deadline",
        "category": "deadline",
        "calendarId": "primary",
        "start": assignment.dueDate.isoformat(),
        "end": deadline_end.isoformat(),
        "startTs": assignment.dueDate,
        "endTs": deadline_end,
        "dateKey": local_deadline.strftime("%Y-%m-%d"),
        "yearMonth": local_deadline.strftime("%Y-%m"),
        "weekKey": f"{iso_year}-W{iso_week:02d}",
        "status": "scheduled",
        "priority": "high",
        "source": "ai_generated",
        "isLocked": True,
        "assignmentId": plan_id,
        "planId": plan_id,
        "subtaskId": None,
        "conflict": {"hasConflict": False, "reason": None},
        "meta": {"estimatedMinutes": 0, "actualMinutes": 0},
        "createdAt": now,
        "updatedAt": now,
    }
    event_writes.append((deadline_ref, deadline_data))
    serialized_events.append({"id": deadline_ref.id, **_serialize(deadline_data)})

    transaction = get_firestore_client().transaction()

    @firestore.transactional
    def commit_schedule(current_transaction):
        latest_snapshot = plan_ref.get(transaction=current_transaction)
        latest = latest_snapshot.to_dict()
        if latest.get("status") == "scheduled":
            return latest.get("events", [])
        if latest.get("revision") != payload.revision:
            raise HTTPException(status_code=409, detail="The plan changed before confirmation.")
        for event_ref, event_data in event_writes:
            current_transaction.set(event_ref, event_data)
        current_transaction.update(plan_ref, {
            "status": "scheduled",
            "events": serialized_events,
            "policy": payload.policy.model_dump(),
            "unscheduledMinutes": result.unscheduled_minutes,
            "updatedAt": now,
        })
        return serialized_events

    committed_events = commit_schedule(transaction)
    return {
        "status": "scheduled",
        "events": _serialize(committed_events),
        "unscheduledMinutes": result.unscheduled_minutes,
    }
