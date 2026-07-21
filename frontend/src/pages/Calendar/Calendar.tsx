import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import { useEffect, useRef, useState } from "react";
import Stepper from "@/components/ui/stepper";
import { useAuth } from "@/hooks/auth-context";
import {
  ensureCalendarFresh,
  getCalendarSnapshot,
  subscribeCalendarCache,
} from "@/lib/calendar-cache";
import type { ApiEvent } from "./types";
import "./Calendar.css";

type CalendarView = "week" | "timeline" | "month";

const viewMap = {
  week: "timeGridWeek",
  timeline: "timeGridDay", // TODO: Replace with the planned custom timeline view.
  month: "dayGridMonth",
} as const;

const STRICTNESS_LABELS: Record<number, string> = {
  1: "Flexible",
  2: "Moderate",
  3: "Strict",
};

// Swatches mirror the fill-and-rail treatment used by events in the calendar.
const CALENDAR_KEY = [
  {
    label: "Deep work and study",
    color: "border-event-study-foreground bg-event-study",
  },
  {
    label: "Classes and meetings",
    color: "border-event-class-foreground bg-event-class",
  },
  {
    label: "Deadlines and exams",
    color: "border-event-deadline-foreground bg-event-deadline",
  },
  {
    label: "Personal, breaks, and admin",
    color: "border-event-muted-foreground bg-event-muted",
  },
] as const;

function getEventCategory(event: ApiEvent) {
  return event.category === "deep_work" ? "deep work" : event.category;
}

function getEventClass(event: ApiEvent) {
  const classes: string[] = [];

  switch (event.category) {
    case "deep_work":
    case "study":
      classes.push("fc-event-study");
      break;
    case "lecture":
    case "meeting":
      classes.push("fc-event-class");
      break;
    case "deadline":
    case "exam":
      classes.push("fc-event-deadline");
      break;
    default:
      classes.push("fc-event-muted");
  }

  if (event.priority === "high") classes.push("fc-event-priority-high");
  if (event.conflict?.hasConflict) classes.push("fc-conflict-bg");
  return classes;
}

function mapApiEventsToCalendarEvents(events: ApiEvent[]): EventInput[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    className: getEventClass(event),
    extendedProps: {
      category: getEventCategory(event),
      status: event.status,
      priority: event.priority,
      source: event.source,
      isLocked: event.isLocked,
      assignmentId: event.assignmentId,
      conflict: event.conflict,
      meta: event.meta,
    },
  }));
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsUserId, setEventsUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiStrictness, setAIStrictness] = useState(3);
  const [view, setView] = useState<CalendarView>("month");
  const [calendarTitle, setCalendarTitle] = useState("");
  const [isPlanningPanelOpen, setIsPlanningPanelOpen] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    if (!user) return;

    const applySnapshot = (snapshot: ReturnType<typeof getCalendarSnapshot>) => {
      if (snapshot.events) {
        setEvents(snapshot.events);
        setEventsUserId(user.uid);
      }
      setLoading(
        snapshot.events === null && (snapshot.isRefreshing || !snapshot.error),
      );
      setError(
        snapshot.events === null && snapshot.error
          ? "Failed to load calendar events."
          : null,
      );
    };

    const unsubscribe = subscribeCalendarCache(user.uid, applySnapshot);
    void ensureCalendarFresh(user.uid).catch((refreshError) => {
      console.error("Error fetching events:", refreshError);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    calendarRef.current?.getApi().changeView(viewMap[view]);
  }, [view]);

  useEffect(() => {
    if (!isPlanningPanelOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPlanningPanelOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPlanningPanelOpen]);

  const handleDatesSet = (arg: DatesSetArg) => setCalendarTitle(arg.view.title);
  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();
  const handleOpenDay = (date: Date) => {
    // Change the view and date together so the clicked day remains the timeline focus.
    setView("timeline");
    calendarRef.current?.getApi().changeView(viewMap.timeline, date);
  };
  const handleDateClick = (arg: DateClickArg) => {
    if (arg.view.type === viewMap.month) handleOpenDay(arg.date);
  };

  const calendarEvents = mapApiEventsToCalendarEvents(
    eventsUserId === user?.uid ? events : [],
  );

  return (
    <div className="dashboard-page mx-auto max-w-7xl">
      <header className="dashboard-page-header desk-enter border-b border-border pb-4 md:pb-5">
        <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Semester view</p>
        <div className="mt-2 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Study calendar</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">Protect the blocks that move an assignment forward.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-control-border bg-field p-1">
              {(["month", "week", "timeline"] as CalendarView[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={view === item}
                  onClick={() => setView(item)}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition-colors ${view === item ? "bg-inverse-surface text-inverse-foreground" : "text-muted-foreground hover:bg-paper hover:text-foreground"}`}
                >
                  {item === "timeline" ? "Timeline" : item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-controls="calendar-planning-drawer"
              aria-expanded={isPlanningPanelOpen}
              onClick={() => setIsPlanningPanelOpen(true)}
              className="calendar-planning-trigger items-center gap-2 rounded-lg border border-control-border bg-paper px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-field"
            >
              <span className="material-symbols-outlined text-base text-primary">tune</span>
              Planning aids
            </button>
            {/* TODO: Connect this control to the workload-rebalancing API. */}
            <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-control-border bg-disabled px-3 py-2.5 text-xs font-bold text-disabled-foreground">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Rebalance planned
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-page-scroll pt-5">
          <CalendarState eyebrow="Preparing your study map" title="Loading calendar events..." />
        </div>
      ) : error ? (
        <div className="dashboard-page-scroll pt-5">
          <CalendarState eyebrow="Calendar unavailable" title={error} isError />
        </div>
      ) : (
        <div className="calendar-layout desk-enter min-h-0 flex-1 gap-4 pt-4 [animation-delay:100ms]">
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-paper">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
              <div>
                <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Schedule</p>
                <h2 className="mt-0.5 font-heading text-xl font-extrabold md:text-2xl">{calendarTitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleToday} className="rounded-md px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">Today</button>
                <div className="flex rounded-lg border border-control-border bg-field p-1">
                  <button type="button" onClick={handlePrev} aria-label="Previous period" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"><span className="material-symbols-outlined text-base">arrow_back</span></button>
                  <button type="button" onClick={handleNext} aria-label="Next period" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"><span className="material-symbols-outlined text-base">arrow_forward</span></button>
                </div>
              </div>
            </div>
            <div className="calendar-shell min-h-0 flex-1 overflow-hidden p-2 md:p-3">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
                initialView={viewMap.month}
                initialDate={new Date()}
                headerToolbar={{ left: "", center: "", right: "" }}
                dayHeaderFormat={{ weekday: "short" }}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                scrollTime="08:00:00"
                allDaySlot={false}
                nowIndicator
                editable={false}
                selectable
                height="100%"
                fixedWeekCount={false}
                showNonCurrentDates={false}
                dayMaxEvents={3}
                navLinks
                navLinkDayClick={handleOpenDay}
                dateClick={handleDateClick}
                events={calendarEvents}
                eventContent={(arg) => {
                  const conflict = arg.event.extendedProps.conflict as
                    | { hasConflict?: boolean }
                    | undefined;

                  return (
                    <div className="calendar-event-content">
                      <p>{arg.event.title}</p>
                      {conflict?.hasConflict && (
                        <span className="calendar-conflict-mark" aria-label="Scheduling conflict">!</span>
                      )}
                    </div>
                  );
                }}
                datesSet={handleDatesSet}
              />
            </div>
          </section>

          <aside className="calendar-desktop-rail min-h-0" aria-label="Calendar planning aids">
            <PlanningPanel aiStrictness={aiStrictness} onStrictnessChange={setAIStrictness} />
          </aside>
        </div>
      )}

      {isPlanningPanelOpen && (
        <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsPlanningPanelOpen(false);
        }}>
          <aside id="calendar-planning-drawer" role="dialog" aria-modal="true" aria-labelledby="calendar-planning-title" className="ml-auto flex h-dvh w-full max-w-sm flex-col border-l border-control-border bg-paper">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Calendar tools</p>
                <h2 id="calendar-planning-title" className="mt-1 font-heading text-xl font-extrabold">Planning aids</h2>
              </div>
              <button type="button" autoFocus onClick={() => setIsPlanningPanelOpen(false)} aria-label="Close planning aids" className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="calendar-planning-drawer-scroll dashboard-page-scroll p-4">
              <PlanningPanel aiStrictness={aiStrictness} onStrictnessChange={setAIStrictness} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function PlanningPanel({ aiStrictness, onStrictnessChange }: { aiStrictness: number; onStrictnessChange: (value: number) => void }) {
  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-border bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">calendar_add_on</span>
            <h3 className="font-heading text-sm font-extrabold">Google Calendar</h3>
          </div>
          <span className="schedule-label text-xs font-bold uppercase text-muted-foreground">Planned</span>
        </div>
        {/* TODO: Connect Google Calendar OAuth and synchronization status. */}
        <button type="button" disabled className="mt-3 w-full cursor-not-allowed rounded-md border border-control-border bg-disabled px-3 py-2 text-xs font-bold text-disabled-foreground">Connect calendar</button>
      </section>

      <section className="rounded-xl border border-border bg-paper p-4">
        <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Calendar key</p>
        <div className="mt-3 space-y-2.5 text-xs">
          {CALENDAR_KEY.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-[3px] border border-l-[4px] ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="calendar-inverse-panel rounded-xl border border-control-border bg-inverse-surface p-4 text-inverse-foreground">
        <p className="schedule-label text-xs font-bold uppercase text-inverse-muted">Planning aid</p>
        <h3 className="mt-2 font-heading text-base font-extrabold text-inverse-foreground">Workload rebalancer</h3>
        {/* TODO: Connect preferences and apply actions to the workload-rebalancing backend. */}
        <div className="mt-4 border-t border-inverse-muted/30 pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><label className="schedule-label text-xs font-bold uppercase text-inverse-muted">Plan rigidity</label><span className="text-xs font-bold text-inverse-foreground">{STRICTNESS_LABELS[aiStrictness]}</span></div>
          <Stepper value={aiStrictness} onChange={onStrictnessChange} min={1} max={3} label="Plan rigidity" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-destructive">warning</span><h3 className="font-heading text-sm font-extrabold">Potential overlap</h3></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Macro Econ study time meets Quant Theory seminar on Tuesday.</p>
        {/* TODO: Connect conflict actions to event conflict detection and update endpoints. */}
        <div className="mt-3 grid gap-2">
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-control-border bg-disabled px-3 py-2 text-left text-xs font-bold text-disabled-foreground">Shift study to 6:00 PM</button>
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-control-border bg-disabled px-3 py-2 text-left text-xs font-bold text-disabled-foreground">Shorten to 45 minutes</button>
        </div>
      </section>
    </div>
  );
}

function CalendarState({ eyebrow, title, isError = false }: { eyebrow: string; title: string; isError?: boolean }) {
  return (
    <section className={`rounded-xl border bg-paper p-8 ${isError ? "border-destructive/25 text-destructive" : "border-border"}`}>
      <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">{eyebrow}</p>
      <p className="mt-3 font-heading text-2xl font-extrabold">{title}</p>
    </section>
  );
}
