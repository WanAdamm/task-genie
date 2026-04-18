// libraries
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { useEffect, useRef, useState } from "react";

// styling
import "./Calendar.css";

// put the -solid in classname for important block of time

const events: EventInput[] = [
  {
    title: "Quant Theory",
    start: "2024-09-16T09:30:00",
    end: "2024-09-16T11:30:00",
    extendedProps: { category: "Seminar" },
    className: "fc-event-tertiary",
  },
  {
    title: "Thesis Review",
    start: "2024-09-16T14:30:00",
    end: "2024-09-16T17:00:00",
    extendedProps: { category: "Deep Work" },
    className: "fc-event-primary",
  },
  {
    title: "Data Arch",
    start: "2024-09-17T10:00:00",
    end: "2024-09-17T11:30:00",
    extendedProps: { category: "Lecture" },
    className: "fc-event-tertiary",
  },
  {
    title: "Macro Econ",
    start: "2024-09-17T12:45:00",
    end: "2024-09-17T14:00:00",
    extendedProps: { category: "Study" },
    className: "fc-event-primary-solid",
  },
  {
    title: "Scheduling Conflict",
    start: "2024-09-17T12:00:00",
    end: "2024-09-17T14:00:00",
    display: "background",
    className: "fc-conflict-bg",
  },
  {
    title: "Code Sprint",
    start: "2024-09-18T15:00:00",
    end: "2024-09-18T19:00:00",
    extendedProps: { category: "Deep Work" },
    className: "fc-event-primary",
  },
  {
    title: "Gym",
    start: "2024-09-19T08:30:00",
    end: "2024-09-19T10:00:00",
    extendedProps: { category: "Gym" },
    className: "fc-event-secondary-muted",
  },
  {
    title: "Ethics Draft",
    start: "2024-09-19T12:00:00",
    end: "2024-09-19T14:00:00",
    extendedProps: { category: "Deadline" },
    className: "fc-event-error",
  },
  {
    title: "Final Wrap",
    start: "2024-09-20T14:00:00",
    end: "2024-09-20T17:00:00",
    extendedProps: { category: "Deep Work" },
    className: "fc-event-primary",
  },
];

type CalendarView = "week" | "timeline" | "month";

const viewMap = {
  week: "timeGridWeek",
  timeline: "timeGridDay", // placeholder
  month: "dayGridMonth",
} as const;

export default function Calendar() {
  // 1) UI state (source of truth)
  const [view, setView] = useState<CalendarView>("week");

  // 2) Ref to FullCalendar instance (for imperative API)
  const calendarRef = useRef<FullCalendar | null>(null);

  // 3) When state changes → tell FullCalendar to switch view
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(viewMap[view]);
    }
  }, [view]);

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 md:px-8">
      <header className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
            Focus Timeline
          </h2>

          <div className="mt-4 flex items-center gap-3">
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

        {/* calendar view switcher + workload rebalancer */}
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center gap-3">
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
          </div>

          <button className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary text-white shadow-lg shadow-primary/10 transition-transform active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-180">
              auto_awesome
            </span>
            Workload Rebalancer
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/*calendar section*/}

        <section className="col-span-12 space-y-6 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/10 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  September 2024
                </h3>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-on-surface-variant">
                    Deep Work
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-tertiary" />
                  <span className="text-xs font-medium text-on-surface-variant">
                    Lectures
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-error" />
                  <span className="text-xs font-medium text-on-surface-variant">
                    Deadlines
                  </span>
                </div>
              </div>
            </div>

            <div className="calendar-shell p-4 md:p-6">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
                initialView={viewMap[view]}
                initialDate="2024-09-17"
                headerToolbar={{
                  left: "prev,next",
                  center: "title",
                  right: "",
                }}
                dayHeaderFormat={{ weekday: "short", day: "numeric" }}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                slotDuration="01:00:00"
                slotLabelInterval="02:00:00"
                allDaySlot={false}
                nowIndicator={true}
                weekends={true}
                editable={false}
                selectable={true}
                height={600}
                events={events}
                eventContent={(arg) => {
                  const category = arg.event.extendedProps.category as
                    | string
                    | undefined;

                  return (
                    <div className="h-full rounded-xl p-2">
                      {category ? (
                        <p className="text-[10px] font-bold uppercase leading-none opacity-80">
                          {category}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs font-bold leading-tight">
                        {arg.event.title}
                      </p>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </section>

        <section className="col-span-12 space-y-8 xl:col-span-3">
          <div className="rounded-xl border border-outline-variant/10 bg-surface/80 p-6 shadow-sm backdrop-blur-[20px] md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <h4 className="font-headline font-bold text-on-surface">
                Conflict Detected
              </h4>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
              Your "Macro Econ" study block overlaps with "Quant Theory" Seminar
              on Tuesday.
            </p>

            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-xl bg-surface-container-high px-6 py-3 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest">
                Shift study to 6:00 PM
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>

              <button className="flex w-full items-center justify-between rounded-xl border border-outline-variant/20 px-6 py-3 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low">
                Squeeze to 45 mins
                <span className="material-symbols-outlined text-sm">
                  compress
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <h4 className="mb-6 font-headline font-bold text-on-surface">
              Rebalancer Settings
            </h4>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    AI Strictness
                  </label>
                  <span className="text-xs font-bold text-primary">
                    Moderate
                  </span>
                </div>

                <input
                  type="range"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-container-high accent-primary"
                />
              </div>

              <div className="space-y-3">
                <label className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-outline-variant/10 transition-colors group-hover:border-primary">
                    <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    Prioritize Early Mornings
                  </span>
                </label>

                <label className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-outline-variant/10 transition-colors group-hover:border-primary" />
                  <span className="text-xs font-semibold text-on-surface">
                    Keep Weekends Empty
                  </span>
                </label>

                <label className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-outline-variant/10 transition-colors group-hover:border-primary">
                    <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    Avoid Back-to-Back Deep Work
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 p-6 text-on-primary shadow-sm md:p-8">
            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <span className="material-symbols-outlined text-4xl text-white/50">
                  calendar_month
                </span>
                <div className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Sync Active
                </div>
              </div>

              <p className="mb-1 text-xs font-medium text-white/60">
                External Events Found
              </p>

              <h5 className="mb-4 font-headline text-3xl font-extrabold">
                12{" "}
                <span className="text-lg font-medium opacity-50">
                  this week
                </span>
              </h5>

              <div className="flex -space-x-2">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#113069] bg-white/10 text-[10px] font-bold">
                  JD
                </div>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#113069] bg-white/10 text-[10px] font-bold">
                  AL
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#113069] bg-primary">
                  <span className="material-symbols-outlined text-xs">add</span>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </section>
      </div>
    </main>
  );
}
