import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth-context";
import {
  ensureCalendarFresh,
  subscribeCalendarCache,
  type CalendarCacheSnapshot,
} from "@/lib/calendar-cache";
import type { ApiEvent } from "@/pages/Calendar/types";

type OverviewSnapshot = CalendarCacheSnapshot & {
  userId: string | null;
};

type RunwayItem = {
  key: string;
  deadline: ApiEvent;
  blocks: ApiEvent[];
};

const ACTIVE_STATUSES = new Set(["scheduled", "rescheduled", "conflicted"]);
const EMPTY_SNAPSHOT: OverviewSnapshot = {
  userId: null,
  events: null,
  isDirty: true,
  isRefreshing: false,
  error: null,
};

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getEventRange(event: ApiEvent) {
  const start = getTimestamp(event.start);
  const end = getTimestamp(event.end);
  return start === null || end === null || end <= start ? null : { start, end };
}

function compareByStart(left: ApiEvent, right: ApiEvent) {
  return (getTimestamp(left.start) ?? Number.MAX_SAFE_INTEGER)
    - (getTimestamp(right.start) ?? Number.MAX_SAFE_INTEGER);
}

function formatLabel(value: string | undefined) {
  if (!value) return "Scheduled";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(minutes: number) {
  const roundedMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  if (!hours) return `${remainingMinutes}M`;
  return remainingMinutes ? `${hours}H ${remainingMinutes}M` : `${hours}H`;
}

function formatTimeRange(event: ApiEvent) {
  const range = getEventRange(event);
  if (!range) return "Time unavailable";
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(range.start)}–${formatter.format(range.end)}`;
}

function formatDeadlineDate(value: string) {
  const timestamp = getTimestamp(value);
  if (timestamp === null) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

function formatDeadlineTime(value: string) {
  const timestamp = getTimestamp(value);
  if (timestamp === null) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatCompactDeadline(value: string) {
  const timestamp = getTimestamp(value);
  if (timestamp === null) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

function formatNextBlock(value: string) {
  const timestamp = getTimestamp(value);
  if (timestamp === null) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function getEventTitleParts(event: ApiEvent) {
  // Planner events encode the course in a title prefix until it becomes structured data.
  const match = event.title.match(/^\[([^\]]+)]\s*(.+)$/);
  return match
    ? { course: match[1], title: match[2] }
    : { course: formatLabel(event.category), title: event.title };
}

function getPlannedMinutes(event: ApiEvent) {
  const estimatedMinutes = event.meta?.estimatedMinutes;
  if (Number.isFinite(estimatedMinutes) && estimatedMinutes > 0) {
    return estimatedMinutes;
  }
  const range = getEventRange(event);
  return range ? (range.end - range.start) / 60_000 : 0;
}

function belongsToDeadline(event: ApiEvent, deadline: ApiEvent) {
  // Match either planner identifier so older events with only one link still appear.
  return Boolean(
    (deadline.planId && event.planId === deadline.planId)
      || (deadline.assignmentId && event.assignmentId === deadline.assignmentId),
  );
}

function getFutureBlocks(events: ApiEvent[], deadline: ApiEvent, now: number) {
  const deadlineAt = getTimestamp(deadline.start);
  if (deadlineAt === null) return [];

  return events
    .filter((event) => {
      const range = getEventRange(event);
      return event.category !== "deadline"
        && ACTIVE_STATUSES.has(event.status)
        && belongsToDeadline(event, deadline)
        && range !== null
        && range.end > now
        && range.start < deadlineAt;
    })
    .sort(compareByStart);
}

function getBlocksSummary(blocks: ApiEvent[]) {
  if (!blocks.length) return "No future study blocks are scheduled before this deadline.";
  const minutes = blocks.reduce((total, block) => total + getPlannedMinutes(block), 0);
  return `${blocks.length} planned ${blocks.length === 1 ? "block" : "blocks"} · ${formatDuration(minutes)} scheduled before the deadline`;
}

export default function Overview() {
  const { user } = useAuth();
  const [clock, setClock] = useState(() => new Date());
  const [snapshot, setSnapshot] = useState<OverviewSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    // Keep local-day and upcoming-deadline calculations accurate on a long-open dashboard.
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sharing Calendar's cache avoids duplicate requests and reflects newly confirmed plans.
    const unsubscribe = subscribeCalendarCache(user.uid, (nextSnapshot) => {
      setSnapshot({ userId: user.uid, ...nextSnapshot });
    });
    void ensureCalendarFresh(user.uid).catch((refreshError) => {
      console.error("Error fetching overview events:", refreshError);
    });
    return unsubscribe;
  }, [user]);

  const currentSnapshot = snapshot.userId === user?.uid ? snapshot : null;
  const hasLoadedEvents = currentSnapshot !== null && currentSnapshot.events !== null;
  const events = currentSnapshot?.events ?? [];
  const error = currentSnapshot?.error ?? null;
  const isRefreshing = currentSnapshot?.isRefreshing ?? false;
  const now = clock.getTime();
  const todayStart = new Date(clock);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // Local interval overlap matches how FullCalendar displays events in the browser.
  const todayEvents = events
    .filter((event) => {
      const range = getEventRange(event);
      return event.category !== "deadline"
        && event.status !== "cancelled"
        && range !== null
        && range.start < tomorrowStart.getTime()
        && range.end > todayStart.getTime();
    })
    .sort(compareByStart);
  const todayMinutes = todayEvents.reduce((total, event) => {
    const range = getEventRange(event);
    if (!range) return total;
    const overlapStart = Math.max(range.start, todayStart.getTime());
    const overlapEnd = Math.min(range.end, tomorrowStart.getTime());
    return total + Math.max(0, overlapEnd - overlapStart) / 60_000;
  }, 0);

  const upcomingDeadlines = events
    .filter((event) => {
      const deadlineAt = getTimestamp(event.start);
      return event.category === "deadline"
        && ACTIVE_STATUSES.has(event.status)
        && deadlineAt !== null
        && deadlineAt >= now;
    })
    .sort(compareByStart);
  const dueSoon = upcomingDeadlines[0] ?? null;
  const dueSoonBlocks = dueSoon ? getFutureBlocks(events, dueSoon, now) : [];

  // One runway card represents one assignment even if duplicate deadline events exist.
  const runwayItems: RunwayItem[] = [];
  const seenAssignmentKeys = new Set<string>();
  for (const deadline of upcomingDeadlines) {
    const key = deadline.planId ?? deadline.assignmentId ?? `deadline:${deadline.id}`;
    if (seenAssignmentKeys.has(key)) continue;
    seenAssignmentKeys.add(key);
    runwayItems.push({ key, deadline, blocks: getFutureBlocks(events, deadline, now) });
    if (runwayItems.length === 3) break;
  }

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(clock);

  const overviewSummary = !hasLoadedEvents
    ? "Loading the work already on your calendar."
    : todayEvents.length
      ? `${todayEvents.length} ${todayEvents.length === 1 ? "block" : "blocks"} on today's calendar${dueSoon ? ", with a deadline ahead." : "."}`
      : dueSoon
        ? "Your day is open. Use the space before the next deadline."
        : "Your calendar is clear today.";

  const handleRetry = () => {
    if (!user) return;
    void ensureCalendarFresh(user.uid).catch((refreshError) => {
      console.error("Error retrying overview events:", refreshError);
    });
  };

  return (
    <div className="dashboard-page mx-auto max-w-7xl">
      <header className="dashboard-page-header desk-enter border-b border-border pb-4">
        <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">{currentDate}</p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Your study desk</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">{overviewSummary}</p>
          </div>
          <Link to="/dashboard/assignments" className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Plan an assignment <span className="material-symbols-outlined text-base">add</span>
          </Link>
        </div>
      </header>

      <div className="dashboard-page-scroll pb-10 pt-6 px-8">
        {!hasLoadedEvents && error ? (
          <section role="alert" className="paper-panel rounded-xl border border-destructive/30 p-6 text-center md:p-10">
            <span aria-hidden="true" className="material-symbols-outlined text-3xl text-destructive">cloud_off</span>
            <h2 className="mt-3 font-heading text-xl font-extrabold">Your schedule could not be loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">Check that the backend is running, then try again.</p>
            <button type="button" onClick={handleRetry} disabled={isRefreshing} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60">
              {isRefreshing ? "Retrying..." : "Try again"}
            </button>
          </section>
        ) : !hasLoadedEvents ? (
          <section aria-live="polite" className="paper-panel rounded-xl border border-border p-8 text-center md:p-12">
            <span aria-hidden="true" className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p className="mt-3 text-sm font-bold">Loading your schedule...</p>
          </section>
        ) : (
          <>
            {error && (
              <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
                <span aria-hidden="true" className="material-symbols-outlined text-base text-destructive">cloud_off</span>
                Showing saved calendar data because the latest refresh failed.
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
              <section className="desk-enter paper-panel rounded-xl border border-border p-5 md:p-7">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Today's line-up</p>
                    <h2 className="mt-1 font-heading text-2xl font-extrabold">Start with the next block</h2>
                  </div>
                  <span className="schedule-label rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{formatDuration(todayMinutes)}</span>
                </div>

                {todayEvents.length ? (
                  <div className="divide-y divide-border">
                    {todayEvents.map((event) => {
                      const isCompleted = event.status === "completed";
                      const hasConflict = event.conflict?.hasConflict;
                      return (
                        <Link key={event.id} to="/dashboard/calendar" className="group flex w-full items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                          {/* Event state is read-only until the API supports status updates. */}
                          <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${isCompleted ? "border-primary bg-primary text-primary-foreground" : hasConflict ? "border-destructive bg-destructive/10 text-destructive" : "border-control-border bg-field text-primary"}`}>
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-sm">check</span>
                            ) : hasConflict ? (
                              <span className="material-symbols-outlined text-sm">priority_high</span>
                            ) : (
                              <span className="size-2 rounded-full bg-current" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-bold ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>{event.title}</span>
                            <span className="schedule-label mt-1 block text-xs text-muted-foreground">
                              {formatTimeRange(event)} · {formatLabel(event.category)} · {formatDuration(getPlannedMinutes(event))}
                              {event.status !== "scheduled" ? ` · ${formatLabel(event.status)}` : ""}
                            </span>
                          </span>
                          <span aria-hidden="true" className="material-symbols-outlined text-base text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">arrow_forward</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-3xl text-muted-foreground">event_available</span>
                    <p className="mt-3 text-sm font-bold">Nothing is scheduled for today.</p>
                    <Link to="/dashboard/calendar" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">Open your calendar</Link>
                  </div>
                )}
              </section>

              <aside className="desk-enter rounded-xl bg-inverse-surface p-6 text-inverse-foreground [animation-delay:80ms] md:p-7">
                <p className="schedule-label text-xs font-bold uppercase text-inverse-muted">Due soon</p>
                {dueSoon ? (() => {
                  const title = getEventTitleParts(dueSoon);
                  return (
                    <>
                      <div className="mt-8 border-l-2 border-destructive pl-4">
                        <p className="font-heading text-3xl font-extrabold">{formatDeadlineDate(dueSoon.start)}</p>
                        <p className="mt-1 text-sm text-inverse-muted">{formatDeadlineTime(dueSoon.start)}</p>
                      </div>
                      <p className="schedule-label mt-8 text-xs font-bold uppercase text-inverse-muted">{title.course}</p>
                      <h2 className="mt-2 font-heading text-xl font-extrabold text-inherit">{title.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-inverse-muted">{getBlocksSummary(dueSoonBlocks)}</p>
                      {dueSoonBlocks[0] && (
                        <div className="mt-6 border-t border-inverse-foreground/15 pt-4">
                          <p className="schedule-label text-xs font-bold uppercase text-inverse-muted">Next planned block</p>
                          <p className="mt-2 text-sm font-bold">{formatNextBlock(dueSoonBlocks[0].start)}</p>
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <div className="mt-10">
                    <span aria-hidden="true" className="material-symbols-outlined text-3xl text-inverse-muted">task_alt</span>
                    <h2 className="mt-4 font-heading text-xl font-extrabold text-inherit">No upcoming deadlines</h2>
                    <p className="mt-2 text-sm leading-6 text-inverse-muted">Confirmed assignment deadlines will appear here.</p>
                  </div>
                )}
              </aside>
            </div>

            <section className="desk-enter mt-7 [animation-delay:160ms]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Confirmed plans</p>
                  <h2 className="mt-1 font-heading text-2xl font-extrabold">Assignment runway</h2>
                </div>
                <Link to="/dashboard/calendar" className="rounded-sm text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">See calendar</Link>
              </div>

              {runwayItems.length ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {runwayItems.map((item) => {
                    const title = getEventTitleParts(item.deadline);
                    const plannedMinutes = item.blocks.reduce((total, block) => total + getPlannedMinutes(block), 0);
                    return (
                      <article key={item.key} className="paper-panel rounded-xl border border-border p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <span className="schedule-label min-w-0 flex-1 text-xs font-bold text-primary">{title.course}</span>
                          <span className="schedule-label shrink-0 text-xs font-bold text-destructive">Due {formatCompactDeadline(item.deadline.start)}</span>
                        </div>
                        <h3 className="mt-5 font-heading text-lg font-extrabold">{title.title}</h3>
                        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
                          <div>
                            <p className="schedule-label text-xs uppercase text-muted-foreground">Blocks ahead</p>
                            <p className="mt-1 text-sm font-extrabold">{item.blocks.length}</p>
                          </div>
                          <div>
                            <p className="schedule-label text-xs uppercase text-muted-foreground">Time planned</p>
                            <p className="mt-1 text-sm font-extrabold">{formatDuration(plannedMinutes)}</p>
                          </div>
                        </div>
                        <p className="schedule-label mt-4 text-xs text-muted-foreground">
                          {item.blocks[0] ? `Next block ${formatNextBlock(item.blocks[0].start)}` : "No future blocks scheduled"}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="paper-panel rounded-xl border border-dashed border-border px-5 py-10 text-center">
                  <p className="text-sm font-bold">No confirmed assignment schedules yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Plan an assignment to add study blocks and its deadline.</p>
                  <Link to="/dashboard/assignments" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">Plan an assignment</Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
