import Stepper from "@/components/ui/stepper";
import type {
  ConfirmResponse,
  GeneratedDraft,
  PlanPriority,
  PlanResponse,
  SchedulePolicy,
  ScheduleResponse,
} from "@/features/assignments/types";
import { weekdays, type AvailabilityConfig } from "@/features/settings/types";
import { useAuth } from "@/hooks/auth-context";
import { apiFetch } from "@/lib/api";
import { runCalendarMutation } from "@/lib/calendar-api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Stage = "blueprint" | "questions" | "draft" | "preview";
type SettingsWithCourses = { courses?: unknown };
const NEW_COURSE_VALUE = "__new_course__";
const priorities: Array<{ value: PlanPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

function normalizeCourses(courses: unknown) {
  if (!Array.isArray(courses)) return [];
  return Array.from(
    new Set(
      courses
        .filter((course): course is string => typeof course === "string")
        .map((course) => course.trim())
        .filter(Boolean),
    ),
  );
}

async function responseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Request failed with status ${response.status}`);
  }
  return data as T;
}

async function saveCourse(courseName: string, currentCourses: string[]) {
  if (currentCourses.includes(courseName)) return currentCourses;
  const settingsResponse = await apiFetch("/api/settings");
  let settings: SettingsWithCourses | null = null;
  if (settingsResponse.ok) settings = await settingsResponse.json();
  if (!settingsResponse.ok && settingsResponse.status !== 404) {
    throw new Error("Could not load settings before saving the course.");
  }
  const persistedCourses = normalizeCourses(settings?.courses);
  const nextCourses = normalizeCourses([
    ...currentCourses,
    ...persistedCourses,
    courseName,
  ]);
  const emptyAvailability: AvailabilityConfig = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    weekly: weekdays.reduce<AvailabilityConfig["weekly"]>((weekly, day) => {
      weekly[day] = [];
      return weekly;
    }, {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }),
    minimumBlockMinutes: 30,
    maximumBlockMinutes: 120,
    breakMinutes: 10,
    maximumDailyMinutes: 360,
  };
  await responseJson(
    await apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        courses: nextCourses,
        availability: settings ? undefined : emptyAvailability,
      }),
    }),
  );
  return nextCourses;
}

const defaultPolicy: SchedulePolicy = {
  allowOutsideWorkHours: false,
  additionalDailyMinutes: 0,
  leaveUnscheduled: false,
};

export default function Assignment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("blueprint");
  const [courseName, setCourseName] = useState("");
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [assignmentType, setAssignmentType] = useState("Essay");
  const [priority, setPriority] = useState<PlanPriority>("medium");
  const [difficulty, setDifficulty] = useState(2);
  const [requirements, setRequirements] = useState("");
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [revision, setRevision] = useState(1);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [policy, setPolicy] = useState<SchedulePolicy>(defaultPolicy);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void apiFetch("/api/settings")
      .then(async (response) => {
        if (!response.ok) return;
        const settings = (await response.json()) as SettingsWithCourses;
        setCourseOptions(normalizeCourses(settings.courses));
      })
      .catch(() => undefined);
  }, [user]);

  const run = async (work: () => Promise<void>) => {
    setIsWorking(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The planner could not continue.");
    } finally {
      setIsWorking(false);
    }
  };

  const createPlan = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const trimmedCourse = courseName.trim();
      if (!trimmedCourse || !dueDate) throw new Error("Choose a course and deadline.");
      const parsedDeadline = new Date(dueDate);
      if (Number.isNaN(parsedDeadline.getTime()) || parsedDeadline <= new Date()) {
        throw new Error("Choose a deadline in the future.");
      }
      if (user) {
        setCourseOptions(await saveCourse(trimmedCourse, courseOptions));
      }
      const response = await responseJson<PlanResponse>(
        await apiFetch("/api/assignment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseName: trimmedCourse,
            dueDate: parsedDeadline.toISOString(),
            assignmentType,
            priority,
            difficulty,
            requirements,
          }),
        }),
      );
      setPlan(response);
      setRevision(response.revision);
      if (response.status === "awaiting_answers") {
        setStage("questions");
      } else {
        setDraft(response.draft ?? null);
        setStage("draft");
      }
    });
  };

  const submitAnswers = () => {
    if (!plan) return;
    void run(async () => {
      const submittedAnswers = (plan.questions ?? []).map((question) => ({
        questionId: question.id,
        answer: answers[question.id]?.trim(),
      }));
      if (submittedAnswers.some((answer) => !answer.answer)) {
        throw new Error("Answer each question before generating the draft.");
      }
      const response = await responseJson<PlanResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: submittedAnswers }),
        }),
      );
      setDraft(response.draft ?? null);
      setRevision(response.revision);
      setStage("draft");
    });
  };

  const updateSubtask = (
    index: number,
    field: "title" | "description" | "estimatedMinutes",
    value: string | number,
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            subtasks: current.subtasks.map((task, taskIndex) =>
              taskIndex === index ? { ...task, [field]: value } : task,
            ),
          }
        : current,
    );
  };

  const saveAndPreview = () => {
    if (!plan || !draft) return;
    void run(async () => {
      if (draft.subtasks.some((task) => task.estimatedMinutes < 15)) {
        throw new Error("Every subtask needs at least 15 minutes.");
      }
      const updated = await responseJson<{ revision: number; draft: GeneratedDraft }>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision, draft }),
        }),
      );
      setRevision(updated.revision);
      const preview = await responseJson<ScheduleResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: updated.revision, policy: defaultPolicy }),
        }),
      );
      setPolicy(defaultPolicy);
      setSchedule(preview);
      setStage("preview");
    });
  };

  const tryOption = (optionId: string) => {
    if (!plan) return;
    if (optionId === "edit_draft") {
      setStage("draft");
      return;
    }
    const nextPolicy: SchedulePolicy = {
      allowOutsideWorkHours: optionId === "outside_work_hours",
      additionalDailyMinutes: optionId === "increase_daily_limit" ? 120 : 0,
      leaveUnscheduled: optionId === "leave_unscheduled",
    };
    void run(async () => {
      const preview = await responseJson<ScheduleResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision, policy: nextPolicy }),
        }),
      );
      setPolicy(nextPolicy);
      setSchedule(preview);
    });
  };

  const confirmSchedule = () => {
    if (!plan) return;
    void run(async () => {
      if (!user) throw new Error("You must be signed in to confirm a schedule.");
      const result = await responseJson<ConfirmResponse | ScheduleResponse>(
        await runCalendarMutation(
          user.uid,
          `/api/assignment-plans/${plan.planId}/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revision, policy }),
          },
          (body) =>
            (body as { status?: string } | null)?.status === "scheduled",
        ),
      );
      if (result.status !== "scheduled") {
        setSchedule(result);
        return;
      }
      navigate("/dashboard/calendar");
    });
  };

  const reset = () => {
    setStage("blueprint");
    setPlan(null);
    setDraft(null);
    setSchedule(null);
    setAnswers({});
    setPolicy(defaultPolicy);
  };

  return (
    <div className="dashboard-page mx-auto w-full max-w-6xl text-foreground">
      <header className="dashboard-page-header border-b border-border pb-5">
        <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Assignment planner</p>
        <div className="mt-1 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Build a credible runway</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Define the work, challenge the estimate, then place it around commitments already on your calendar.</p>
          </div>
          {stage !== "blueprint" && (
            <button type="button" onClick={reset} className="text-xs font-bold text-muted-foreground hover:text-foreground">Start over</button>
          )}
        </div>
      </header>

      <div className="dashboard-page-scroll pb-10 pt-6">
        <ol className="mb-8 grid grid-cols-4 overflow-hidden rounded-xl border border-border bg-card">
          {(["Blueprint", "Questions", "Estimate", "Schedule"] as const).map((label, index) => {
            const activeIndex = { blueprint: 0, questions: 1, draft: 2, preview: 3 }[stage];
            return (
              <li key={label} className={`border-r border-border px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider last:border-r-0 ${index <= activeIndex ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <span className="mr-1 hidden sm:inline">0{index + 1}</span>{label}
              </li>
            );
          })}
        </ol>

        {error && <div role="alert" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}

        {stage === "blueprint" && (
          <form onSubmit={createPlan} className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <h2 className="font-heading text-xl font-bold">What does finished look like?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Paste enough of the brief for the planner to distinguish real deliverables from generic study advice.</p>
              <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={14} placeholder="Paste the assignment brief, rubric, required sections, source requirements, or current progress..." className="mt-6 w-full resize-none rounded-xl border border-control-border bg-field p-4 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30" />
              <p className="mt-2 text-right text-[10px] font-bold uppercase text-muted-foreground">{requirements.trim() ? requirements.trim().split(/\s+/).length : 0} words of context</p>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <h2 className="font-heading text-xl font-bold">Blueprint</h2>
              <div className="mt-6 space-y-5">
                <label className="block text-xs font-bold text-muted-foreground">Course
                  <select value={isAddingCourse ? NEW_COURSE_VALUE : courseName} onChange={(event) => { if (event.target.value === NEW_COURSE_VALUE) { setIsAddingCourse(true); setCourseName(""); } else { setIsAddingCourse(false); setCourseName(event.target.value); } }} className="mt-2 w-full rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground">
                    <option value="">Select a course</option>
                    {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
                    <option value={NEW_COURSE_VALUE}>Add new course...</option>
                  </select>
                  {isAddingCourse && <input autoFocus value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Course name" className="mt-2 w-full rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground" />}
                </label>
                <label className="block text-xs font-bold text-muted-foreground">Deadline
                  <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 w-full rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground" />
                </label>
                <label className="block text-xs font-bold text-muted-foreground">Assignment type
                  <select value={assignmentType} onChange={(event) => setAssignmentType(event.target.value)} className="mt-2 w-full rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground">
                    <option>Essay</option><option>Lab Report</option><option>Final Project</option><option>Discussion Post</option><option>Presentation</option>
                  </select>
                </label>
                <fieldset><legend className="text-xs font-bold text-muted-foreground">Priority</legend><div className="mt-2 grid grid-cols-3 gap-2">{priorities.map((item) => <button key={item.value} type="button" aria-pressed={priority === item.value} onClick={() => setPriority(item.value)} className={`rounded-xl border px-3 py-3 text-xs font-bold ${priority === item.value ? "border-primary bg-primary text-primary-foreground" : "border-control-border bg-field text-muted-foreground"}`}>{item.label}</button>)}</div></fieldset>
                <div><p className="text-xs font-bold text-muted-foreground">Difficulty</p><div className="mt-2 flex items-center gap-3"><Stepper value={difficulty} onChange={setDifficulty} max={3} label="Assignment difficulty" /><span className="text-xs font-bold">{["Easy", "Medium", "Hard"][difficulty - 1]}</span></div></div>
              </div>
              <button disabled={isWorking} className="mt-8 w-full rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled disabled:text-disabled-foreground">{isWorking ? "Reading the brief..." : "Build work estimate"}</button>
            </section>
          </form>
        )}

        {stage === "questions" && plan && (
          <section className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Up to three useful questions</p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold">The brief leaves decisions open</h2>
            <p className="mt-2 text-sm text-muted-foreground">These answers materially affect the breakdown. Availability is handled separately.</p>
            <div className="mt-8 space-y-6">{plan.questions?.map((question, index) => <label key={question.id} className="block"><span className="font-heading text-base font-bold">{index + 1}. {question.question}</span><span className="mt-1 block text-xs text-muted-foreground">{question.reason}</span><textarea rows={3} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="mt-3 w-full rounded-xl border border-control-border bg-field p-4 text-sm" /></label>)}</div>
            <button type="button" disabled={isWorking} onClick={submitAnswers} className="mt-8 w-full rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled">{isWorking ? "Building estimate..." : "Generate editable estimate"}</button>
          </section>
        )}

        {stage === "draft" && draft && (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <section className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Provisional estimate</p><h2 className="mt-2 font-heading text-2xl font-extrabold">{draft.summary}</h2><p className="mt-2 text-sm text-muted-foreground">Review the work and durations. Nothing reaches your calendar until you confirm the preview.</p></div>
              {draft.subtasks.map((task, index) => <article key={task.id} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><input aria-label={`Subtask ${index + 1} title`} value={task.title} onChange={(event) => updateSubtask(index, "title", event.target.value)} className="w-full border-0 bg-transparent font-heading text-base font-bold outline-none" /><textarea aria-label={`Subtask ${index + 1} description`} rows={2} value={task.description} onChange={(event) => updateSubtask(index, "description", event.target.value)} className="mt-2 w-full resize-none rounded-lg border border-control-border bg-field p-3 text-sm text-muted-foreground" /><div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs font-bold text-muted-foreground">Minutes <input type="number" min={15} step={15} value={task.estimatedMinutes} onChange={(event) => updateSubtask(index, "estimatedMinutes", Number(event.target.value))} className="ml-2 w-20 rounded-lg border border-control-border bg-field px-2 py-1.5 text-foreground" /></label><span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase">{task.category.replace("_", " ")}</span>{task.dependencies.length > 0 && <span className="text-[10px] font-bold uppercase text-muted-foreground">After {task.dependencies.join(", ")}</span>}</div></div></div></article>)}
            </section>
            <aside className="h-fit rounded-xl border border-border bg-card p-6 lg:sticky lg:top-0"><p className="text-xs font-bold uppercase text-muted-foreground">Total effort</p><p className="mt-1 font-heading text-4xl font-extrabold text-primary">{Math.round(draft.subtasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) / 6) / 10}<span className="ml-1 text-sm text-muted-foreground">hours</span></p><div className="mt-6 space-y-2">{draft.assumptions.map((assumption) => <p key={assumption} className="text-xs leading-relaxed text-muted-foreground">{assumption}</p>)}</div><button type="button" disabled={isWorking} onClick={saveAndPreview} className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled">{isWorking ? "Finding free time..." : "Preview schedule"}</button></aside>
          </div>
        )}

        {stage === "preview" && schedule && (
          <section className="mx-auto max-w-4xl">
            {schedule.status === "needs_availability" ? <div className="rounded-xl border border-warning/30 bg-card p-8 text-center"><span className="material-symbols-outlined text-4xl text-warning">calendar_clock</span><h2 className="mt-3 font-heading text-2xl font-extrabold">Set your work hours first</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{schedule.message} Your browser timezone will be used automatically.</p><button type="button" onClick={() => navigate("/dashboard/settings#availability")} className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Open work-hour settings</button></div> : <>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8"><p className={`text-xs font-bold uppercase tracking-wider ${schedule.status === "ready" ? "text-success" : "text-warning"}`}>{schedule.status === "ready" ? "Ready to place" : "Not enough free time"}</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="font-heading text-2xl font-extrabold">{schedule.status === "ready" ? "The runway fits" : `${schedule.unscheduledMinutes} minutes still need a home`}</h2><p className="mt-1 text-sm text-muted-foreground">Required {schedule.requiredMinutes} minutes. Available {schedule.availableMinutes} minutes under the selected policy.</p></div>{schedule.status === "ready" && <button type="button" disabled={isWorking} onClick={confirmSchedule} className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled">{isWorking ? "Checking calendar..." : "Confirm and add to calendar"}</button>}</div></div>
              {schedule.status === "infeasible" && <div className="mt-5 grid gap-3 sm:grid-cols-2">{schedule.options?.map((option) => <button key={option.id} type="button" disabled={isWorking} onClick={() => tryOption(option.id)} className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/60"><span className="font-bold">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.description}</span></button>)}</div>}
              {!!schedule.proposedEvents?.length && <div className="mt-6 space-y-3">{schedule.proposedEvents.map((event, index) => <div key={`${event.subtaskId}-${event.start}-${index}`} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"><div className="w-28 shrink-0 text-xs font-bold text-primary">{new Date(event.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}<span className="mt-1 block text-muted-foreground">{new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{event.title}</p><p className="text-xs text-muted-foreground">{event.estimatedMinutes} minutes</p></div></div>)}</div>}
              {schedule.status === "infeasible" && policy.leaveUnscheduled && <button type="button" disabled={isWorking} onClick={confirmSchedule} className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground">Schedule what fits</button>}
            </>}
          </section>
        )}
      </div>
    </div>
  );
}
