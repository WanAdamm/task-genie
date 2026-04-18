// FullCalendar Imports
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// Types
import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import type { ApiEvent } from "./calendar";

// React
import { useEffect, useRef, useState } from "react";

// Styling
import "./Calendar.css";

// ----------------------------------------
// TYPES
// ----------------------------------------

// UI-level calendar view state
type CalendarView = "week" | "timeline" | "month";

// Map UI view → FullCalendar internal view
// NOTE: timeline is currently a fallback (premium feature not used)
const viewMap = {
  week: "timeGridWeek",
  timeline: "timeGridDay", // placeholder until custom timeline
  month: "dayGridMonth",
} as const;

// ----------------------------------------
// DATA TRANSFORMATION
// Backend → FullCalendar format
// ----------------------------------------

/**
 * Convert API event structure into FullCalendar-compatible format
 * - Keeps raw API data in extendedProps for flexible rendering
 */
function mapApiEventsToCalendarEvents(events: ApiEvent[]): EventInput[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,

    className: getEventClass(event),

    // Extended metadata (used in custom rendering / logic)
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

// function to map deep_work to deep work
function getEventCategory(event: ApiEvent) {
  var category = "";

  switch (event.category) {
    case "deep_work":
      category = "deep work";
      break;

    default:
      category = event.category;
  }

  return category
}

// function to map category to tailwind class
function getEventClass(event: ApiEvent) {
  const classes: string[] = [];

  // ----------------------------------------
  // CATEGORY → BASE STYLE
  // ----------------------------------------
  switch (event.category) {
    case "deep_work":
      classes.push("fc-event-primary");
      break;

    case "lecture":
      classes.push("fc-event-tertiary");
      break;

    case "deadline":
      classes.push("fc-event-error");
      break;

    case "study":
      classes.push("fc-event-primary");
      break;

    case "meeting":
      classes.push("fc-event-tertiary");
      break;

    case "exam":
      classes.push("fc-event-error");
      break;

    case "personal":
    case "break":
    case "admin":
      classes.push("fc-event-secondary-muted");
      break;

    default:
      classes.push("fc-event-secondary-muted");
  }

  // ----------------------------------------
  // PRIORITY → STRONGER VISUAL
  // ----------------------------------------
  if (event.priority === "high") {
    classes.push("fc-event-primary-solid");
  }

  // ----------------------------------------
  // CONFLICT → OVERLAY WARNING
  // ----------------------------------------
  if (event.conflict?.hasConflict) {
    classes.push("fc-conflict-bg");
  }

  return classes;
}

// ----------------------------------------
// MAIN COMPONENT
// ----------------------------------------

export default function Calendar() {
  // ----------------------------------------
  // STATE: Backend data
  // ----------------------------------------

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------
  // STATE: UI control (view switching)
  // ----------------------------------------

  const [view, setView] = useState<CalendarView>("week");
  // UI state for header title shown above the calendar
  const [calendarTitle, setCalendarTitle] = useState("");

  // Ref to access FullCalendar instance (imperative API)
  const calendarRef = useRef<FullCalendar | null>(null);

  // ----------------------------------------
  // EFFECT: Fetch events from FastAPI
  // ----------------------------------------

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://127.0.0.1:8000/events/");

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data: ApiEvent[] = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load calendar events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ----------------------------------------
  // EFFECT: Sync React state → FullCalendar view
  // ----------------------------------------

  useEffect(() => {
    if (calendarRef.current) {
      // Imperative API call to switch view dynamically
      calendarRef.current.getApi().changeView(viewMap[view]);
    }
  }, [view]);

  // prev next button
  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  // Sync FullCalendar's active title into React state
  const handleDatesSet = (arg: DatesSetArg) => {
    setCalendarTitle(arg.view.title);
  };

  // Transform events for FullCalendar
  const calendarEvents = mapApiEventsToCalendarEvents(events);

  // ----------------------------------------
  // UI: Loading & Error states
  // ----------------------------------------

  if (loading) {
    return <div className="p-6">Loading calendar...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">{error}</div>;
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 md:px-8">
      {/* HEADER */}
      <header className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        {/* Title + Status */}
        <div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
            Focus Timeline
          </h2>

          {/* External system indicators */}
          <div className="mt-4 flex items-center gap-3">
            {/* Google Calendar Sync */}
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-low px-3 py-1.5">
              <span
                className="material-symbols-outlined text-sm text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sync
              </span>
              <span className="text-xs font-semibold text-on-surface-variant">
                Google Calendar Connected
              </span>
            </div>

            {/* AI Planner Status */}
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/10 bg-tertiary-container/30 px-3 py-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary">
                auto_awesome
              </span>
              <span className="text-xs font-semibold text-on-tertiary-container text-opacity-80">
                AI Rebalancer Ready
              </span>
            </div>
          </div>
        </div>

        {/* VIEW SWITCHER + ACTION */}
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex rounded-xl border border-outline-variant/10 bg-surface-container-low p-1">
            {(["week", "timeline", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors
                  ${
                    view === v
                      ? "border border-outline-variant/10 bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* AI Rebalancer Button */}
          <button className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-transform active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-180">
              auto_awesome
            </span>
            Workload Rebalancer
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* CALENDAR SECTION */}
        <section className="col-span-12 space-y-6 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
            {/* Calendar Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/10 p-6 md:p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface">
                {calendarTitle}
              </h3>
              <div className="flex rounded-xl border border-outline-variant/10 bg-surface-container-low p-1">
                <button
                  onClick={handlePrev}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary"
                >
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary"
                >
                  Next
                </button>
              </div>
            </div>

            {/* CALENDAR */}
            <div className="calendar-shell p-4 md:p-6">
              <FullCalendar
                ref={calendarRef}
                // Plugins define available views
                plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
                // Initial view only applies once (dynamic changes handled via ref)
                initialView={viewMap[view]}
                initialDate="2026-05-01"
                headerToolbar={{
                  left: "",
                  center: "",
                  right: "",
                }}
                dayHeaderFormat={{ weekday: "short", day: "numeric" }}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                nowIndicator={true}
                editable={false}
                selectable={true}
                height={600}
                // Core data input
                events={calendarEvents}
                /**
                 * Custom event rendering
                 * Uses extendedProps for richer display
                 */
                eventContent={(arg) => {
                  const category = arg.event.extendedProps.category as
                    | string
                    | undefined;

                  return (
                    <div className="h-full rounded-xl p-2">
                      {category && (
                        <p className="text-[10px] font-bold uppercase opacity-80">
                          {category}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-bold">
                        {arg.event.title}
                      </p>
                    </div>
                  );
                }}
                datesSet={handleDatesSet}
              />
            </div>
          </div>
        </section>

        {/* SIDE PANEL (unchanged structure) */}
        <section className="col-span-12 space-y-8 xl:col-span-3">
          {/* (kept same — UI-only, no logic issues here) */}
        </section>
      </div>
    </main>
  );
}
