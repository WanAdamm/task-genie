import Stepper from "@/components/ui/stepper";
import {
  weekdays,
  type AvailabilityConfig,
  type Weekday,
} from "@/features/settings/types";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type Strategy = "frog" | "balanced" | "night";
type CalendarSyncConfig = {
  googleCalendar: {
    connected: boolean;
    provider: "google";
    syncEnabled: boolean;
    syncMode: "two_way" | "one_way" | "manual";
  };
};

const defaultCalendarSync: CalendarSyncConfig = {
  googleCalendar: {
    connected: false,
    provider: "google",
    syncEnabled: false,
    syncMode: "two_way",
  },
};

const weekdayLabels: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function emptyWorkDays(): Record<Weekday, boolean> {
  return Object.fromEntries(weekdays.map((day) => [day, false])) as Record<
    Weekday,
    boolean
  >;
}

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

export default function Settings() {
  const [level, setLevel] = useState(3);
  const [primaryAlert, setPrimaryAlert] = useState(14);
  const [secondaryAlert, setSecondaryAlert] = useState(21);

  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [calendarSync, setCalendarSync] = useState<CalendarSyncConfig>(defaultCalendarSync);
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [workDays, setWorkDays] = useState(emptyWorkDays);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [minimumBlockMinutes, setMinimumBlockMinutes] = useState(30);
  const [maximumBlockMinutes, setMaximumBlockMinutes] = useState(120);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [maximumDailyMinutes, setMaximumDailyMinutes] = useState(360);

  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(
    null,
  );
  const [editingCourseName, setEditingCourseName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch("/api/settings");
        if (!res.ok) return;

        const data = await res.json();
        const strategyMap: Record<string, Strategy> = {
          early: "frog",
          balanced: "balanced",
          late: "night",
        };

        const loadedPrimaryAlert = data.reminders.primaryAlertDays;
        setPrimaryAlert(loadedPrimaryAlert);
        setSecondaryAlert(
          Math.max(data.reminders.secondaryAlertDays, loadedPrimaryAlert + 1),
        );
        setLevel(data.two_way.confidenceLevel);
        setStrategy(strategyMap[data.two_way.taskDifficultyStrategy]);
        setDailyDigest(data.email.dailyDigest);
        setWeeklyReport(data.email.weeklyReport);
        setDeadlineAlerts(data.email.deadlineAlerts);
        if (data.calendarSync) setCalendarSync(data.calendarSync);
        setCourses(normalizeCourses(data.courses));
        if (data.availability) {
          const availability = data.availability as AvailabilityConfig;
          const hasConfiguredHours = weekdays.some(
            (day) => availability.weekly[day]?.length > 0,
          );
          if (hasConfiguredHours) setTimezone(availability.timezone);
          setWorkDays(
            Object.fromEntries(
              weekdays.map((day) => [day, availability.weekly[day]?.length > 0]),
            ) as Record<Weekday, boolean>,
          );
          const firstWindow = weekdays
            .flatMap((day) => availability.weekly[day] ?? [])
            .at(0);
          if (firstWindow) {
            setWorkStart(firstWindow.start);
            setWorkEnd(firstWindow.end);
          }
          setMinimumBlockMinutes(availability.minimumBlockMinutes);
          setMaximumBlockMinutes(availability.maximumBlockMinutes);
          setBreakMinutes(availability.breakMinutes);
          setMaximumDailyMinutes(availability.maximumDailyMinutes);
        }
      } catch {
        // Existing cached preferences still support discard if settings are unavailable.
      }
    };

    void loadSettings();
  }, []);

  const showCourseError = (text: string) => {
    setSaveMessage({ type: "error", text });
    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  };

  const handlePrimaryAlertChange = (value: number) => {
    setPrimaryAlert(value);
    setSecondaryAlert((currentSecondaryAlert) =>
      Math.max(currentSecondaryAlert, value + 1),
    );
  };

  const handleAddCourse = () => {
    const courseName = newCourseName.trim();

    if (!courseName) return;
    if (courses.includes(courseName)) {
      showCourseError("That course already exists.");
      return;
    }

    setCourses([...courses, courseName]);
    setNewCourseName("");
  };

  const handleStartEditCourse = (index: number) => {
    setEditingCourseIndex(index);
    setEditingCourseName(courses[index]);
  };

  const handleUpdateCourse = () => {
    if (editingCourseIndex === null) return;

    const courseName = editingCourseName.trim();
    if (!courseName) {
      showCourseError("Course name cannot be empty.");
      return;
    }

    if (
      courses.some(
        (course, index) => course === courseName && index !== editingCourseIndex,
      )
    ) {
      showCourseError("That course already exists.");
      return;
    }

    setCourses(
      courses.map((course, index) =>
        index === editingCourseIndex ? courseName : course,
      ),
    );
    setEditingCourseIndex(null);
    setEditingCourseName("");
  };

  const handleDeleteCourse = (indexToDelete: number) => {
    setCourses(courses.filter((_, index) => index !== indexToDelete));
    setEditingCourseIndex(null);
    setEditingCourseName("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      let coursesToSave = courses;
      const courseToAdd = newCourseName.trim();

      if (editingCourseIndex !== null) {
        const editedCourseName = editingCourseName.trim();

        if (!editedCourseName) {
          throw new Error("Course name cannot be empty.");
        }

        if (
          courses.some(
            (course, index) =>
              course === editedCourseName && index !== editingCourseIndex,
          )
        ) {
          throw new Error("That course already exists.");
        }

        coursesToSave = courses.map((course, index) =>
          index === editingCourseIndex ? editedCourseName : course,
        );
        setCourses(coursesToSave);
        setEditingCourseIndex(null);
        setEditingCourseName("");
      }

      if (courseToAdd) {
        if (coursesToSave.includes(courseToAdd)) {
          throw new Error("That course already exists.");
        }

        coursesToSave = [...coursesToSave, courseToAdd];
        setCourses(coursesToSave);
        setNewCourseName("");
      }

      if (workEnd <= workStart) {
        throw new Error("Work-hour end time must be later than the start time.");
      }
      if (maximumBlockMinutes < minimumBlockMinutes) {
        throw new Error("Maximum block length must be at least the minimum length.");
      }

      const payload = {
        calendarSync,
        email: {
          dailyDigest: dailyDigest,
          deadlineAlerts: deadlineAlerts,
          weeklyReport: weeklyReport,
        },
        reminders: {
          primaryAlertDays: primaryAlert,
          secondaryAlertDays: Math.max(secondaryAlert, primaryAlert + 1),
        },
        two_way: {
          confidenceLevel: level,
          taskDifficultyStrategy:
            strategy === "frog"
              ? "early"
              : strategy === "night"
                ? "late"
                : "balanced",
        },
        courses: normalizeCourses(coursesToSave),
        availability: {
          timezone,
          weekly: Object.fromEntries(
            weekdays.map((day) => [
              day,
              workDays[day] ? [{ start: workStart, end: workEnd }] : [],
            ]),
          ) as AvailabilityConfig["weekly"],
          minimumBlockMinutes,
          maximumBlockMinutes,
          breakMinutes,
          maximumDailyMinutes,
        } satisfies AvailabilityConfig,
      };

      const res = await apiFetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorText = "Failed to save preferences";

        try {
          const errorData = await res.json();
          errorText = errorData.detail || errorText;
        } catch {
          // ignore JSON parsing failure
        }

        throw new Error(errorText);
      }

      await res.json();

      setSaveMessage({
        type: "success",
        text: "Preferences saved successfully.",
      });

      // Cache non-course preferences only. Courses are settings-endpoint data.
      const { courses: _courses, ...cacheablePayload } = payload;
      void _courses;
      localStorage.setItem("settings", JSON.stringify(cacheablePayload));
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSaving(false);

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  const hydrateFromStorage = () => {
    const cached = localStorage.getItem("settings");
    if (!cached) return;

    const data = JSON.parse(cached);

    const strategyMap: Record<string, Strategy> = {
      early: "frog",
      balanced: "balanced",
      late: "night",
    };

    const cachedPrimaryAlert = data.reminders.primaryAlertDays;
    setPrimaryAlert(cachedPrimaryAlert);
    setSecondaryAlert(
      Math.max(data.reminders.secondaryAlertDays, cachedPrimaryAlert + 1),
    );
    setLevel(data.two_way.confidenceLevel);
    setStrategy(strategyMap[data.two_way.taskDifficultyStrategy]);
    setDailyDigest(data.email.dailyDigest);
    setWeeklyReport(data.email.weeklyReport);
    setDeadlineAlerts(data.email.deadlineAlerts);
    if (data.calendarSync) setCalendarSync(data.calendarSync);
    if (data.availability) {
      const availability = data.availability as AvailabilityConfig;
      const hasConfiguredHours = weekdays.some(
        (day) => availability.weekly[day]?.length > 0,
      );
      if (hasConfiguredHours) setTimezone(availability.timezone);
      setWorkDays(
        Object.fromEntries(
          weekdays.map((day) => [day, availability.weekly[day]?.length > 0]),
        ) as Record<Weekday, boolean>,
      );
      const firstWindow = weekdays
        .flatMap((day) => availability.weekly[day] ?? [])
        .at(0);
      if (firstWindow) {
        setWorkStart(firstWindow.start);
        setWorkEnd(firstWindow.end);
      }
      setMinimumBlockMinutes(availability.minimumBlockMinutes);
      setMaximumBlockMinutes(availability.maximumBlockMinutes);
      setBreakMinutes(availability.breakMinutes);
      setMaximumDailyMinutes(availability.maximumDailyMinutes);
    }
  };

  // rehydrate from storage and ask user confirmation
  const handleDiscard = () => {
    if (!confirm("Discard all unsaved changes?")) return;

    try {
      hydrateFromStorage();

      setSaveMessage({
        type: "success",
        text: "Changes discarded.",
      });
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  return (
    <div className="dashboard-page mx-auto w-full max-w-6xl text-foreground">
      <header className="dashboard-page-header w-full max-w-4xl border-b border-border pb-4">
        <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Preferences</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Settings & Reminders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Curate your cognitive environment and notification flow.
        </p>
      </header>

      <div className="dashboard-page-scroll w-full max-w-4xl space-y-8 pb-8 pt-6 px-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mail</span>
            <h2 className="text-xl font-bold text-foreground">
              Email Notifications
            </h2>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-foreground">Daily Digest</p>
                <p className="text-sm text-muted-foreground">
                  Morning briefing of your tasks and upcoming exams.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  aria-label="Daily digest"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                />
                 <div className="relative h-6 w-11 rounded-full bg-control-border transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-control-border after:bg-control-thumb after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground peer-checked:after:bg-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background" />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-foreground">Weekly Report</p>
                <p className="text-sm text-muted-foreground">
                  Performance overview and time-allocation analytics.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  aria-label="Weekly report"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                />
                 <div className="relative h-6 w-11 rounded-full bg-control-border transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-control-border after:bg-control-thumb after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground peer-checked:after:bg-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background" />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-foreground">Deadline Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Critical notifications for tasks due within 24 hours.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  aria-label="Deadline alerts"
                  checked={deadlineAlerts}
                  onChange={(e) => setDeadlineAlerts(e.target.checked)}
                />
                 <div className="relative h-6 w-11 rounded-full bg-control-border transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-control-border after:bg-control-thumb after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground peer-checked:after:bg-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background" />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              alarm
            </span>
            <h2 className="text-xl font-bold text-foreground">
              Reminder Thresholds
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">
                    Primary Alert
                  </label>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {primaryAlert} Days Before
                  </span>
                </div>

                <Stepper
                  value={primaryAlert}
                  onChange={handlePrimaryAlertChange}
                  min={1}
                  max={14}
                  label="Primary reminder lead time"
                />

                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  <span>1 Day</span>
                  <span>7 Days</span>
                  <span>14 Days</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">
                    Secondary Alert
                  </label>
                  <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-foreground">
                    {secondaryAlert} Days Before
                  </span>
                </div>

                <Stepper
                  value={secondaryAlert}
                  onChange={setSecondaryAlert}
                  min={primaryAlert + 1}
                  max={30}
                  label="Secondary reminder lead time"
                />

                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  <span>{primaryAlert + 1} Days</span>
                  <span>15 Days</span>
                  <span>30 Days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sync</span>
            <h2 className="text-xl font-bold text-foreground">
              Calendar Sync Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-surface-container-low">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzbT3qZEf1qLPsg8OXu-BTvi6Jq9A_KTb8-_90qWrtzypXQVI63DhO31iI3MKuddI4pxE_oYovcI4qZkDaBl1Lnzl4nJh_aYGg7CQMaXKI0PW0pSYLG7JeRU8QIhQGh-JfQ9ssDNhXQ1ZYslVZ76B8hUdk6eSOLB8LC5hzODkoZBWNDW_UA0X-TbpbbM_O_2Th6O2VQDipIZUvQvkfIBGW4dS_6u9B13f3FuYPW5DzCtc_HrByOZHod7ji7FB2PgV5gveOwPmbCJk"
                    alt="Google Calendar"
                    className="size-6"
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-bold">Google Calendar</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Connection planned
                  </p>
                </div>
              </div>

              {/* TODO: Connect Google Calendar OAuth and synchronization management. */}
              <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-disabled px-6 py-3 text-xs font-bold text-disabled-foreground">
                Connect calendar
              </button>
            </div>
          </div>
        </section>

        <section id="availability">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_clock</span>
            <h2 className="text-xl font-bold text-foreground">Work hours</h2>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <p className="font-bold text-foreground">When can TaskGenie schedule focused work?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                These windows are combined with your TaskGenie calendar. No work is placed until at least one day is selected.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {weekdays.map((day) => (
                <button
                  key={day}
                  type="button"
                  aria-pressed={workDays[day]}
                  onClick={() =>
                    setWorkDays((current) => ({ ...current, [day]: !current[day] }))
                  }
                  className={`rounded-xl border px-2 py-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    workDays[day]
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-control-border bg-field text-muted-foreground hover:border-primary/60"
                  }`}
                >
                  {weekdayLabels[day]}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-muted-foreground">
                Start time
                <input
                  type="time"
                  value={workStart}
                  onChange={(event) => setWorkStart(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                End time
                <input
                  type="time"
                  value={workEnd}
                  onChange={(event) => setWorkEnd(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Daily limit (minutes)
                <input
                  type="number"
                  min={30}
                  max={960}
                  step={30}
                  value={maximumDailyMinutes}
                  onChange={(event) => setMaximumDailyMinutes(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Break (minutes)
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={5}
                  value={breakMinutes}
                  onChange={(event) => setBreakMinutes(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Minimum block
                <input
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={minimumBlockMinutes}
                  onChange={(event) => setMinimumBlockMinutes(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Maximum block
                <input
                  type="number"
                  min={30}
                  max={360}
                  step={15}
                  value={maximumBlockMinutes}
                  onChange={(event) => setMaximumBlockMinutes(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground sm:col-span-2">
                Timezone
                <input
                  type="text"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-control-border bg-field px-3 py-2.5 text-sm text-foreground"
                />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            <h2 className="text-xl font-bold text-foreground">Courses</h2>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCourse();
                  }
                }}
                placeholder="Add a course, e.g. Cognitive Psychology 101"
                aria-label="New course name"
                className="min-w-0 flex-1 rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <button
                type="button"
                onClick={handleAddCourse}
                className="rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-ambient transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
              >
                Add Course
              </button>
            </div>

            {courses.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low px-4 py-3 text-sm font-medium text-muted-foreground">
                No courses configured yet. Add courses here to make them
                available in Assignment Blueprint.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course, index) => {
                  const isEditing = editingCourseIndex === index;

                  return (
                    <div
                      key={`${course}-${index}`}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-container-low p-4 md:flex-row md:items-center"
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingCourseName}
                          onChange={(e) => setEditingCourseName(e.target.value)}
                          aria-label={`Edit ${course} course name`}
                          className="min-w-0 flex-1 rounded-xl border border-control-border bg-field px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                        />
                      ) : (
                        <p className="min-w-0 flex-1 text-sm font-bold text-foreground">
                          {course}
                        </p>
                      )}

                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleUpdateCourse}
                              className="rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourseIndex(null);
                                setEditingCourseName("");
                              }}
                              className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-surface-container-high hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditCourse(index)}
                            className="rounded-xl bg-paper px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(index)}
                          className="rounded-xl bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
              Course changes are saved to your settings when you select Save
              Preferences.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              auto_awesome
            </span>
            <h2 className="text-xl font-bold text-foreground">
              AI Personalization
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-foreground">
                  Task Difficulty Preference
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  How should the AI suggest scheduling your most difficult
                  tasks?
                </p>

                <div className="flex flex-col gap-3 md:flex-row">
                  {/* Eat the Frog */}
                  <button
                    type="button"
                    aria-pressed={strategy === "frog"}
                    onClick={() => setStrategy("frog")}
                    className={`flex-1 rounded-xl border px-6 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      ${
        strategy === "frog"
          ? "border-primary bg-primary font-bold text-primary-foreground shadow-sm"
          : "border-control-border bg-field font-semibold text-foreground hover:border-primary/60"
      }`}
                  >
                    Eat the Frog (Early)
                  </button>

                  {/* Balanced */}
                  <button
                    type="button"
                    aria-pressed={strategy === "balanced"}
                    onClick={() => setStrategy("balanced")}
                    className={`flex-1 rounded-xl border px-6 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      ${
        strategy === "balanced"
          ? "border-primary bg-primary font-bold text-primary-foreground shadow-sm"
          : "border-control-border bg-field font-semibold text-foreground hover:border-primary/60"
      }`}
                  >
                    Balanced Flow
                  </button>

                  {/* Night Owl */}
                  <button
                    type="button"
                    aria-pressed={strategy === "night"}
                    onClick={() => setStrategy("night")}
                    className={`flex-1 rounded-xl border px-6 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      ${
        strategy === "night"
          ? "border-primary bg-primary font-bold text-primary-foreground shadow-sm"
          : "border-control-border bg-field font-semibold text-foreground hover:border-primary/60"
      }`}
                  >
                    Night Owl Focus
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-border bg-surface-container-low p-6 shadow-sm md:p-8">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                  <span
                    className="material-symbols-outlined text-8xl"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    psychology
                  </span>
                </div>

                <div className="relative z-10">
                  <h4 className="mb-2 text-sm font-bold text-foreground">
                    Confidence Scrubber
                  </h4>
                  <p className="mb-6 max-w-lg text-xs text-muted-foreground">
                    Adjust how strictly the AI adheres to your predicted study
                    habits vs. experimenting with new peak performance times.
                  </p>

                  <Stepper value={level} onChange={setLevel} label="Planner confidence" />

                  <div className="mt-2 flex justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Strict Logic
                    </span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Creative Insights
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="w-full max-w-4xl shrink-0 border-t border-border bg-background pt-4">
        {/* toast message */}
        {saveMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              saveMessage.type === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          {/* discard change button */}
          <button
            type="button"
            onClick={handleDiscard}
            className="w-full rounded-xl px-6 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-auto"
          >
            Discard Changes
          </button>

          {/* save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto ${
              isSaving
                ? "cursor-not-allowed bg-disabled text-disabled-foreground shadow-none"
                : "bg-primary text-primary-foreground shadow-ambient hover:bg-primary/90"
            }`}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </footer>
    </div>
  );
}
