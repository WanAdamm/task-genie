import { useState } from "react";
import { Link } from "react-router-dom";

type Task = { text: string; detail: string; done?: boolean };

const assignments = [
  { course: "ENV-204", title: "Ethics position paper", due: "Fri, 2 days", progress: 68, color: "bg-event-study-foreground" },
  { course: "CS-101", title: "Research proposal", due: "Next Tue", progress: 22, color: "bg-event-class-foreground" },
  { course: "HIS-318", title: "Primary source notes", due: "Next Thu", progress: 90, color: "bg-event-deadline-foreground" },
];

export default function Overview() {
  const [tasks, setTasks] = useState<Task[]>([
    { text: "Outline the ethics argument", detail: "ENV-204 · 45 min", done: true },
    { text: "Annotate two journal articles", detail: "CS-101 · 30 min" },
    { text: "Draft the opening paragraph", detail: "ENV-204 · 30 min" },
    { text: "Send a question about Lab 4", detail: "BIO-110 · 10 min" },
  ]);

  return (
    <div className="dashboard-page mx-auto max-w-7xl">
      <header className="dashboard-page-header desk-enter border-b border-border pb-4">
        <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Thursday, October 24</p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Your study desk</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">Four clear moves. One deadline worth protecting.</p>
          </div>
          <Link to="/dashboard/assignments" className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Plan an assignment <span className="material-symbols-outlined text-base">add</span>
          </Link>
        </div>
      </header>

      <div className="dashboard-page-scroll pb-10 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <section className="desk-enter paper-panel rounded-xl border border-border p-5 md:p-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Today’s line-up</p>
              <h2 className="mt-1 font-heading text-2xl font-extrabold">Start with the next block</h2>
            </div>
            <span className="schedule-label rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">3H 10M</span>
          </div>
          <div className="divide-y divide-border">
            {tasks.map((task, index) => (
              <button type="button" key={task.text} aria-pressed={Boolean(task.done)} onClick={() => setTasks((items) => items.map((item, i) => i === index ? { ...item, done: !item.done } : item))} className="group flex w-full items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${task.done ? "border-primary bg-primary text-primary-foreground" : "border-control-border bg-field group-hover:border-primary group-focus-visible:border-primary"}`}>
                  {task.done && <span aria-hidden="true" className="material-symbols-outlined text-sm">check</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-bold ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.text}</span>
                  <span className="schedule-label mt-1 block text-[10px] text-muted-foreground">{task.detail}</span>
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-base text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">arrow_forward</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="desk-enter rounded-xl bg-inverse-surface p-6 text-inverse-foreground [animation-delay:80ms] md:p-7">
          <p className="schedule-label text-[10px] font-bold uppercase text-inverse-muted">Due soon</p>
          <div className="mt-8 border-l-2 border-destructive pl-4">
            <p className="font-heading text-3xl font-extrabold">Friday</p>
            <p className="mt-1 text-sm text-inverse-muted">11:59 PM</p>
          </div>
          <h2 className="mt-8 font-heading text-xl font-extrabold text-inherit">Ethics position paper</h2>
          <p className="mt-2 text-sm leading-6 text-inverse-muted">You need one focused writing block today to stay on pace.</p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-inverse-foreground/15"><div className="h-full w-[68%] bg-destructive" /></div>
          <p className="schedule-label mt-3 text-[10px] text-inverse-muted">68% prepared</p>
        </aside>
        </div>

        <section className="desk-enter mt-7 [animation-delay:160ms]">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Open work</p><h2 className="mt-1 font-heading text-2xl font-extrabold">Assignment runway</h2></div>
          <Link to="/dashboard/calendar" className="rounded-sm text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">See calendar</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {assignments.map((assignment) => (
            <article key={assignment.course} className="paper-panel rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4"><span className="schedule-label text-[10px] font-bold text-primary">{assignment.course}</span><span className="schedule-label text-[10px] font-bold text-destructive">{assignment.due}</span></div>
              <h3 className="mt-5 font-heading text-lg font-extrabold">{assignment.title}</h3>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className={`h-full ${assignment.color}`} style={{ width: `${assignment.progress}%` }} /></div>
              <p className="schedule-label mt-2 text-[10px] text-muted-foreground">{assignment.progress}% prepared</p>
            </article>
          ))}
        </div>
        </section>
      </div>
    </div>
  );
}
