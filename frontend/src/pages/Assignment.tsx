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
import {
  clearBlueprintDraft,
  clearPlanWorkingCopy,
  getBlueprintDraft,
  getPlanWorkingCopy,
  saveBlueprintDraft,
  savePlanWorkingCopy,
} from "@/lib/assignment-draft-cache";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  const responseText = await response.text();
  let data: { detail?: string } | T | null = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText) as { detail?: string } | T;
    } catch {
      if (response.ok) throw new Error("The server returned an invalid response.");
    }
  }
  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? data.detail
        : null;
    throw new Error(
      detail || responseText || `Request failed with status ${response.status}`,
    );
  }
  if (data === null) throw new Error("The server returned an empty response.");
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
  const { planId: routePlanId } = useParams();
  const initialBlueprint = user ? getBlueprintDraft(user.uid) : null;
  const [stage, setStage] = useState<Stage>("blueprint");
  const [courseName, setCourseName] = useState(initialBlueprint?.courseName ?? "");
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [dueDate, setDueDate] = useState(initialBlueprint?.dueDate ?? "");
  const [assignmentType, setAssignmentType] = useState(initialBlueprint?.assignmentType ?? "Essay");
  const [priority, setPriority] = useState<PlanPriority>(initialBlueprint?.priority ?? "medium");
  const [difficulty, setDifficulty] = useState(initialBlueprint?.difficulty ?? 2);
  const [requirements, setRequirements] = useState(initialBlueprint?.requirements ?? "");
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [policy, setPolicy] = useState<SchedulePolicy>(defaultPolicy);
  const [isWorking, setIsWorking] = useState(false);
  const [isHydrating, setIsHydrating] = useState(Boolean(routePlanId));
  const [isExpired, setIsExpired] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef(1);
  const answersRef = useRef<Record<string, string>>({});
  const draftRef = useRef<GeneratedDraft | null>(null);
  const answerDirtyRef = useRef(false);
  const draftDirtyRef = useRef(false);
  const answerSaveRef = useRef<Promise<void> | null>(null);
  const draftSaveRef = useRef<Promise<void> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCurrentRevision = (value: number) => {
    revisionRef.current = value;
  };

  const toLocalDateTime = (value: string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

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

  useEffect(() => {
    if (!user || routePlanId) return;
    saveBlueprintDraft(user.uid, {
      courseName,
      dueDate,
      assignmentType,
      priority,
      difficulty,
      requirements,
    });
  }, [
    assignmentType,
    courseName,
    difficulty,
    dueDate,
    priority,
    requirements,
    routePlanId,
    user,
  ]);

  useEffect(() => {
    if (!user || !routePlanId) return;
    let active = true;

    void apiFetch(`/api/assignment-plans/${routePlanId}`)
      .then((response) => responseJson<PlanResponse>(response))
      .then(async (detail) => {
        if (!active) return;
        if (detail.status === "scheduled") {
          navigate("/dashboard/calendar", { replace: true });
          return;
        }
        if (detail.status === "cancelled") {
          navigate("/dashboard/assignments", { replace: true });
          return;
        }

        const workingCopy = getPlanWorkingCopy(user.uid, routePlanId);
        const savedAnswers = Object.fromEntries(
          (detail.answers ?? []).map((answer) => [answer.questionId, answer.answer]),
        );
        const workingCopyCanResume = workingCopy?.revision === detail.revision;
        const restoredAnswers =
          workingCopyCanResume && workingCopy?.answers
            ? { ...savedAnswers, ...workingCopy.answers }
            : savedAnswers;
        const restoredDraft =
          workingCopyCanResume && workingCopy?.draft
            ? workingCopy.draft
            : detail.draft ?? null;

        setPlan(detail);
        setCurrentRevision(detail.revision);
        setCourseName(detail.assignment.courseName);
        setDueDate(toLocalDateTime(detail.assignment.dueDate));
        setAssignmentType(detail.assignment.assignmentType);
        setPriority(detail.assignment.priority);
        setDifficulty(detail.assignment.difficulty);
        setRequirements(detail.assignment.requirements);
        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;
        setDraft(restoredDraft);
        draftRef.current = restoredDraft;
        setPolicy(detail.policy ?? defaultPolicy);
        setIsExpired(detail.status === "expired");

        const hasUnsavedAnswers = JSON.stringify(restoredAnswers) !== JSON.stringify(savedAnswers);
        const hasUnsavedDraft =
          restoredDraft !== null && JSON.stringify(restoredDraft) !== JSON.stringify(detail.draft ?? null);

        if (detail.status === "awaiting_answers" || detail.status === "expired" && !restoredDraft) {
          setStage("questions");
        } else if (detail.status === "preview" && !hasUnsavedDraft) {
          try {
            const preview = await responseJson<ScheduleResponse>(
              await apiFetch(`/api/assignment-plans/${routePlanId}/preview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  revision: detail.revision,
                  policy: detail.policy ?? defaultPolicy,
                }),
              }),
            );
            if (active) {
              setCurrentRevision(preview.revision ?? detail.revision);
              setSchedule(preview);
              setStage("preview");
            }
          } catch (previewError) {
            if (active) {
              setStage("draft");
              setError(
                previewError instanceof Error
                  ? previewError.message
                  : "Could not restore the schedule preview.",
              );
            }
          }
        } else {
          setStage("draft");
        }

        answerDirtyRef.current = hasUnsavedAnswers;
        draftDirtyRef.current = hasUnsavedDraft;
        setSaveState(hasUnsavedAnswers || hasUnsavedDraft ? "unsaved" : "saved");
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not restore this plan.");
      })
      .finally(() => {
        if (active) setIsHydrating(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, routePlanId, user]);

  useEffect(() => {
    return () => {
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!plan || isExpired) return;
    const millisecondsUntilDeadline =
      new Date(plan.assignment.dueDate).getTime() - Date.now();
    if (millisecondsUntilDeadline <= 0) {
      queueMicrotask(() => setIsExpired(true));
      return;
    }
    const timer = setTimeout(
      () => setIsExpired(true),
      Math.min(millisecondsUntilDeadline, 2_147_483_647),
    );
    return () => clearTimeout(timer);
  }, [isExpired, plan]);

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

  const cacheWorkingCopy = (
    nextAnswers = answersRef.current,
    nextDraft = draftRef.current,
  ) => {
    if (!user || !plan) return;
    savePlanWorkingCopy(user.uid, plan.planId, {
      revision: revisionRef.current,
      answers: nextAnswers,
      draft: nextDraft ?? undefined,
    });
  };

  async function flushAnswers(): Promise<void> {
    if (answerSaveRef.current) {
      await answerSaveRef.current;
      if (answerDirtyRef.current) await flushAnswers();
      return;
    }
    if (!plan || !user || isExpired || !answerDirtyRef.current) return;

    answerDirtyRef.current = false;
    const snapshot = { ...answersRef.current };
    setSaveState("saving");
    const request = (async () =>
      responseJson<PlanResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revision: revisionRef.current,
            answers: (plan.questions ?? []).map((question) => ({
              questionId: question.id,
              answer: snapshot[question.id] ?? "",
            })),
          }),
        }),
      ))()
      .then((response) => {
        setPlan(response);
        setCurrentRevision(response.revision);
        cacheWorkingCopy(answersRef.current, draftRef.current);
        setSaveState("saved");
      })
      .catch((caught) => {
        answerDirtyRef.current = true;
        setSaveState("error");
        setError(caught instanceof Error ? caught.message : "Could not save answers.");
        throw caught;
      })
      .finally(() => {
        answerSaveRef.current = null;
      });
    answerSaveRef.current = request;
    await request;
    if (answerDirtyRef.current) await flushAnswers();
  }

  async function flushDraft(): Promise<void> {
    if (draftSaveRef.current) {
      await draftSaveRef.current;
      if (draftDirtyRef.current) await flushDraft();
      return;
    }
    if (!plan || !user || isExpired || !draftDirtyRef.current || !draftRef.current) return;

    draftDirtyRef.current = false;
    const snapshot = draftRef.current;
    setSaveState("saving");
    const request = (async () =>
      responseJson<{ revision: number; draft: GeneratedDraft }>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revisionRef.current, draft: snapshot }),
        }),
      ))()
      .then((response) => {
        setCurrentRevision(response.revision);
        cacheWorkingCopy(answersRef.current, draftRef.current);
        setSaveState("saved");
      })
      .catch((caught) => {
        draftDirtyRef.current = true;
        setSaveState("error");
        setError(caught instanceof Error ? caught.message : "Could not save the estimate.");
        throw caught;
      })
      .finally(() => {
        draftSaveRef.current = null;
      });
    draftSaveRef.current = request;
    await request;
    if (draftDirtyRef.current) await flushDraft();
  }

  const updateAnswer = (questionId: string, value: string) => {
    const nextAnswers = { ...answersRef.current, [questionId]: value };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    answerDirtyRef.current = true;
    setSaveState("unsaved");
    cacheWorkingCopy(nextAnswers, draftRef.current);
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
    answerTimerRef.current = setTimeout(() => {
      void flushAnswers().catch(() => undefined);
    }, 700);
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
      setCurrentRevision(response.revision);
      if (user) clearBlueprintDraft(user.uid);
      navigate(`/dashboard/assignments/${response.planId}`, { replace: true });
      if (response.status === "awaiting_answers") {
        setStage("questions");
      } else {
        setDraft(response.draft ?? null);
        draftRef.current = response.draft ?? null;
        setStage("draft");
      }
    });
  };

  const submitAnswers = () => {
    if (!plan) return;
    void run(async () => {
      if ((plan.questions ?? []).some((question) => !answersRef.current[question.id]?.trim())) {
        throw new Error("Answer each question before generating the draft.");
      }
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
      await flushAnswers();
      const response = await responseJson<PlanResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/generate-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revisionRef.current }),
        }),
      );
      setPlan(response);
      setDraft(response.draft ?? null);
      draftRef.current = response.draft ?? null;
      setCurrentRevision(response.revision);
      cacheWorkingCopy(answersRef.current, response.draft ?? null);
      setSaveState("saved");
      setStage("draft");
    });
  };

  const updateSubtask = (
    index: number,
    field: "title" | "description" | "estimatedMinutes",
    value: string | number,
  ) => {
    if (!draftRef.current || isExpired) return;
    const nextDraft = {
      ...draftRef.current,
      subtasks: draftRef.current.subtasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task,
      ),
    };
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    draftDirtyRef.current = true;
    setSaveState("unsaved");
    cacheWorkingCopy(answersRef.current, nextDraft);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      void flushDraft().catch(() => undefined);
    }, 700);
  };

  const saveAndPreview = () => {
    if (!plan || !draft) return;
    void run(async () => {
      if (draft.subtasks.some((task) => task.estimatedMinutes < 15)) {
        throw new Error("Every subtask needs at least 15 minutes.");
      }
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      await flushDraft();
      const preview = await responseJson<ScheduleResponse>(
        await apiFetch(`/api/assignment-plans/${plan.planId}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revisionRef.current, policy: defaultPolicy }),
        }),
      );
      setPolicy(defaultPolicy);
      setSchedule(preview);
      setCurrentRevision(preview.revision ?? revisionRef.current);
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
          body: JSON.stringify({ revision: revisionRef.current, policy: nextPolicy }),
        }),
      );
      setPolicy(nextPolicy);
      setSchedule(preview);
      setCurrentRevision(preview.revision ?? revisionRef.current);
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
            body: JSON.stringify({ revision: revisionRef.current, policy }),
          },
          (body) =>
            (body as { status?: string } | null)?.status === "scheduled",
        ),
      );
      if (result.status !== "scheduled") {
        setSchedule(result);
        return;
      }
      if (user) clearPlanWorkingCopy(user.uid, plan.planId);
      navigate("/dashboard/calendar");
    });
  };

  const reset = () => {
    if (!plan) {
      if (user) clearBlueprintDraft(user.uid);
      navigate("/dashboard/assignments/new", { replace: true });
      return;
    }
    if (!confirm("Discard this unfinished assignment plan and start over?")) return;
    void run(async () => {
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      if (answerSaveRef.current) await answerSaveRef.current;
      if (draftSaveRef.current) await draftSaveRef.current;
      await flushAnswers();
      await flushDraft();
      await responseJson(
        await apiFetch(`/api/assignment-plans/${plan.planId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revisionRef.current }),
        }),
      );
      if (user) clearPlanWorkingCopy(user.uid, plan.planId);
      navigate("/dashboard/assignments/new", { replace: true });
    });
  };

  if (isHydrating) {
    return (
      <div className="dashboard-page mx-auto w-full max-w-6xl text-foreground">
        <div className="dashboard-page-scroll flex min-h-80 items-center justify-center">
          <p className="text-sm font-semibold text-muted-foreground">Restoring your assignment plan...</p>
        </div>
      </div>
    );
  }

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
            <button type="button" disabled={isWorking} onClick={reset} className="text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-50">Discard and start over</button>
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
        {isExpired && <div role="alert" className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">This assignment deadline has passed. You can review or discard this plan, but it can no longer be scheduled.</div>}

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
            <div className="mt-8 space-y-6">{plan.questions?.map((question, index) => <label key={question.id} className="block"><span className="font-heading text-base font-bold">{index + 1}. {question.question}</span><span className="mt-1 block text-xs text-muted-foreground">{question.reason}</span><textarea rows={3} disabled={isExpired || saveState === "saving"} value={answers[question.id] ?? ""} onChange={(event) => updateAnswer(question.id, event.target.value)} onBlur={() => void flushAnswers().catch(() => undefined)} className="mt-3 w-full rounded-xl border border-control-border bg-field p-4 text-sm disabled:opacity-60" /></label>)}</div>
            <div className="mt-4 text-right text-[10px] font-bold uppercase text-muted-foreground" aria-live="polite">{saveState === "saving" ? "Saving answers..." : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Save failed" : "Answers saved"}</div>
            <button type="button" disabled={isWorking || isExpired} onClick={submitAnswers} className="mt-4 w-full rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled">{isWorking ? "Building estimate..." : "Generate editable estimate"}</button>
          </section>
        )}

        {stage === "draft" && draft && (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <section className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Provisional estimate</p><h2 className="mt-2 font-heading text-2xl font-extrabold">{draft.summary}</h2><p className="mt-2 text-sm text-muted-foreground">Review the work and durations. Nothing reaches your calendar until you confirm the preview.</p></div>
              {draft.subtasks.map((task, index) => <article key={task.id} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><input aria-label={`Subtask ${index + 1} title`} disabled={isExpired || saveState === "saving"} value={task.title} onChange={(event) => updateSubtask(index, "title", event.target.value)} onBlur={() => void flushDraft().catch(() => undefined)} className="w-full border-0 bg-transparent font-heading text-base font-bold outline-none disabled:opacity-60" /><textarea aria-label={`Subtask ${index + 1} description`} rows={2} disabled={isExpired || saveState === "saving"} value={task.description} onChange={(event) => updateSubtask(index, "description", event.target.value)} onBlur={() => void flushDraft().catch(() => undefined)} className="mt-2 w-full resize-none rounded-lg border border-control-border bg-field p-3 text-sm text-muted-foreground disabled:opacity-60" /><div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs font-bold text-muted-foreground">Minutes <input type="number" min={15} step={15} disabled={isExpired || saveState === "saving"} value={task.estimatedMinutes} onChange={(event) => updateSubtask(index, "estimatedMinutes", Number(event.target.value))} onBlur={() => void flushDraft().catch(() => undefined)} className="ml-2 w-20 rounded-lg border border-control-border bg-field px-2 py-1.5 text-foreground disabled:opacity-60" /></label><span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase">{task.category.replace("_", " ")}</span>{task.dependencies.length > 0 && <span className="text-[10px] font-bold uppercase text-muted-foreground">After {task.dependencies.join(", ")}</span>}</div></div></div></article>)}
            </section>
            <aside className="h-fit rounded-xl border border-border bg-card p-6 lg:sticky lg:top-0"><p className="text-xs font-bold uppercase text-muted-foreground">Total effort</p><p className="mt-1 font-heading text-4xl font-extrabold text-primary">{Math.round(draft.subtasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) / 6) / 10}<span className="ml-1 text-sm text-muted-foreground">hours</span></p><p className="mt-3 text-[10px] font-bold uppercase text-muted-foreground" aria-live="polite">{saveState === "saving" ? "Saving estimate..." : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Save failed" : "Estimate saved"}</p><div className="mt-6 space-y-2">{draft.assumptions.map((assumption) => <p key={assumption} className="text-xs leading-relaxed text-muted-foreground">{assumption}</p>)}</div><button type="button" disabled={isWorking || isExpired} onClick={saveAndPreview} className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground disabled:bg-disabled">{isWorking ? "Finding free time..." : "Preview schedule"}</button></aside>
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
