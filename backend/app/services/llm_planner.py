import os
from datetime import datetime, timezone, timedelta
from typing import List, Literal
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from services.firestore import getSettings, get_events_collection

# Define the schema we want Gemini to return
class GeneratedEvent(BaseModel):
    title: str = Field(
        description="Actionable, descriptive title for the study block (e.g., 'Research peer sources for cognitive load', 'Draft Introduction section', 'Proofread essay and compile references')"
    )
    category: Literal["deep_work", "study", "deadline", "break", "admin"] = Field(
        description="The type of study block. Use deep_work for drafting/heavy writing, study for reading/prep, admin for bibliography/organizing, deadline for the final submission itself."
    )
    start: str = Field(
        description="Start time of the block in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). Tasks should be scheduled at sensible hours (e.g. between 09:00 and 21:00)."
    )
    end: str = Field(
        description="End time of the block in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). Typically 1-3 hours after start."
    )
    priority: Literal["low", "medium", "high"] = Field(
        description="Priority of the study block"
    )
    estimatedMinutes: int = Field(
        description="Estimated duration in minutes (e.g., 60, 90, 120)"
    )

class GeneratedPlanResponse(BaseModel):
    events: List[GeneratedEvent] = Field(
        description="A list of planned study/deadline events scheduled between now and the assignment due date."
    )

def generate_assignment_plan(
    course_name: str,
    due_date: datetime,
    assignment_type: str,
    priority: str,
    difficulty: int,
    requirements: str
) -> List[dict]:
    """
    Generates a task schedule using Gemini based on assignment details and student preferences,
    then saves the generated events to Firestore.
    """
    # 1. Retrieve user preferences from Firestore settings
    strategy = "balanced"
    confidence = 3
    try:
        settings_doc = getSettings().get()
        if settings_doc.exists:
            data = settings_doc.to_dict()
            two_way = data.get("two_way", {})
            strategy = two_way.get("taskDifficultyStrategy", "balanced")
            confidence = two_way.get("confidenceLevel", 3)
    except Exception as e:
        print(f"Error fetching settings, using defaults: {e}")

    # 2. Setup Gemini client & Check for API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        api_key = api_key.strip()
    
    now_dt = datetime.now()

    if not api_key:
        print("WARNING: GEMINI_API_KEY is not set. Falling back to Mock Planner mode.")
        # Generate realistic mock events based on the user strategy
        mock_events = []
        total_days = (due_date - now_dt).days
        if total_days < 1:
            total_days = 1
            
        # Determine milestones offsets based on strategy
        if strategy == "early":
            offsets = [0.1, 0.3, 0.6]
        elif strategy == "late":
            offsets = [0.5, 0.7, 0.9]
        else: # balanced
            offsets = [0.2, 0.5, 0.8]
            
        milestones = [
            ("Research and Source Collection", "study", 120, "medium"),
            ("Drafting Outline and Core Content", "deep_work", 180, "high"),
            ("Review, Formatting and Editing", "admin", 90, "low")
        ]
        
        for i, (title, cat, mins, prio) in enumerate(milestones):
            day_offset = int(total_days * offsets[i])
            event_start = now_dt + timedelta(days=day_offset, hours=10 + i) # schedule during sensible hours
            event_end = event_start + timedelta(minutes=mins)
            mock_events.append(GeneratedEvent(
                title=title,
                category=cat,
                start=event_start.isoformat(),
                end=event_end.isoformat(),
                priority=prio,
                estimatedMinutes=mins
            ))
            
        # Add the deadline event
        mock_events.append(GeneratedEvent(
            title="Final Submission Deadline",
            category="deadline",
            start=due_date.isoformat(),
            end=(due_date + timedelta(minutes=30)).isoformat(),
            priority="high",
            estimatedMinutes=30
        ))
        
        parsed_response = GeneratedPlanResponse(events=mock_events)
    else:
        client = genai.Client(api_key=api_key)

        # 3. Formulate the prompt
        now_str = now_dt.strftime("%A, %Y-%m-%d %H:%M:%S")
        due_str = due_date.strftime("%A, %Y-%m-%d %H:%M:%S")

        prompt = f"""
        You are an expert student scheduler and cognitive load optimizer.
        Generate a study plan/schedule of calendar events for a student to complete their assignment.
        
        Assignment Details:
        - Course Name: {course_name}
        - Due Date: {due_str}
        - Assignment Type: {assignment_type}
        - Assignment Priority: {priority}
        - Assignment Difficulty: {difficulty}/3
        - Requirements/Description: {requirements}

        Current Time (Today): {now_str}
        
        Scheduling Constraints & Strategy:
        - User Preference Workload Strategy: {strategy.upper()}
          * BALANCED: Evenly distribute tasks/study blocks over the available days.
          * EARLY: Schedule major, heavy research/drafting blocks earlier in the timeline (first half of the period), leaving only light review/polishing tasks towards the deadline.
          * LATE: Schedule more tasks closer to the deadline, leaving the beginning relatively free.
        - AI Confidence Setting: {confidence}/5 (Higher confidence means more structured study slots).
        - Sensible Hours: Do not schedule study sessions in the middle of the night (e.g. sleep hours between 22:00 and 08:00).
        - Sensible Durations: Study blocks should generally range from 60 to 180 minutes.
        - Deadline Event: You MUST include exactly one final "deadline" category event representing the submission at the actual due date: {due_str}.
        - Chronology: Tasks must start on or after the current time ({now_str}) and must end on or before the due date ({due_str}).
        """

        # 4. Request Gemini with Structured Output
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedPlanResponse,
                system_instruction=(
                    "You are an expert calendar planner. You output structured lists of "
                    "sensibly-scheduled tasks to guide students through completing assignments."
                )
            )
        )

        # Parse response structured schema
        parsed_response = response.parsed

    saved_events = []
    events_collection = get_events_collection()

    # Generate a unique assignment ID for grouping
    assignment_id = f"ai_plan_{int(datetime.now().timestamp())}_{course_name.lower().replace(' ', '_')}"

    # 5. Process and Save Events
    for event in parsed_response.events:
        try:
            start_dt = datetime.fromisoformat(event.start)
            end_dt = datetime.fromisoformat(event.end)
        except Exception:
            # Fallback parsing in case datetime format differs
            try:
                start_dt = datetime.strptime(event.start, "%Y-%m-%dT%H:%M:%S")
                end_dt = datetime.strptime(event.end, "%Y-%m-%dT%H:%M:%S")
            except Exception:
                # If everything fails, schedule starting now + offsets
                start_dt = now_dt + timedelta(hours=2)
                end_dt = start_dt + timedelta(minutes=event.estimatedMinutes)

        # Basic bounds checking (clamp to today/due date)
        if start_dt < now_dt:
            # Shift forward
            diff = now_dt - start_dt + timedelta(hours=1)
            start_dt += diff
            end_dt += diff

        if end_dt > due_date:
            # Clamp to due date
            end_dt = due_date
            start_dt = end_dt - timedelta(minutes=event.estimatedMinutes)

        iso_year, iso_week, _ = start_dt.isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"

        doc_data = {
            "title": f"[{course_name}] {event.title}",
            "category": event.category,
            "calendarId": "primary",
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
            "startTs": start_dt,
            "endTs": end_dt,
            "dateKey": start_dt.strftime("%Y-%m-%d"),
            "yearMonth": start_dt.strftime("%Y-%m"),
            "weekKey": week_key,
            "status": "scheduled",
            "priority": event.priority,
            "source": "ai_generated",
            "isLocked": False,
            "assignmentId": assignment_id,
            "conflict": {"hasConflict": False, "reason": None},
            "meta": {
                "estimatedMinutes": event.estimatedMinutes,
                "actualMinutes": 0
            },
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }

        # Write to Firestore
        doc_ref = events_collection.document()
        doc_ref.set(doc_data)

        # Add serialized details to return list
        saved_events.append({
            "id": doc_ref.id,
            **{k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in doc_data.items()}
        })

    return saved_events
