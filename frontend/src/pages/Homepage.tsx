import { Link } from "react-router-dom";

const steps = [
  ["01", "Name the work", "Add the brief, course, and due date."],
  ["02", "Set the pace", "Tell TaskGenie what a realistic week looks like."],
  ["03", "Work the next block", "A clear study block lands in your calendar."],
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid max-w-7xl items-stretch gap-8 px-6 py-12 md:px-10 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="desk-enter flex flex-col justify-center py-6 lg:py-12">
          <p className="schedule-label mb-7 text-[11px] font-bold uppercase text-muted-foreground">
            A study planner for real semesters
          </p>
          <h1 className="max-w-3xl font-heading text-5xl font-extrabold leading-[0.96] text-foreground md:text-7xl">
            Make room for the work that matters.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            TaskGenie turns one assignment brief into a sequence of study blocks you can actually keep. Less rearranging. More starting.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-ambient transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Start planning <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-border bg-paper/70 px-5 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Open the study desk
            </Link>
          </div>
        </div>

        <div className="desk-enter paper-panel relative min-h-[430px] overflow-hidden rounded-2xl border border-border p-5 [animation-delay:120ms] md:p-8">
          <div className="absolute bottom-0 left-10 top-0 w-px bg-destructive/35" />
          <div className="relative ml-6">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Thursday / study map</p>
                <p className="mt-1 font-heading text-xl font-extrabold">Environmental ethics paper</p>
              </div>
              <span className="rounded-full bg-destructive px-3 py-1.5 schedule-label text-[10px] font-bold text-destructive-foreground">DUE FRI</span>
            </div>
            <div className="mt-7 space-y-4">
              <div className="grid grid-cols-[58px_1fr] gap-4">
                <span className="schedule-label pt-3 text-[10px] text-muted-foreground">16:00</span>
                <div className="rounded-lg border-l-4 border-primary bg-primary/10 p-3">
                  <p className="text-sm font-bold">Outline the argument</p>
                  <p className="mt-1 text-xs text-muted-foreground">45 min · deep work</p>
                </div>
              </div>
              <div className="grid grid-cols-[58px_1fr] gap-4">
                <span className="schedule-label pt-3 text-[10px] text-muted-foreground">17:00</span>
                <div className="rounded-lg border-l-4 border-event-class-foreground bg-event-class p-3 text-event-class-foreground">
                  <p className="text-sm font-bold">Read two counterarguments</p>
                  <p className="mt-1 text-xs text-muted-foreground">30 min · research</p>
                </div>
              </div>
              <div className="grid grid-cols-[58px_1fr] gap-4">
                <span className="schedule-label pt-3 text-[10px] text-muted-foreground">19:30</span>
                <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-3">
                  <p className="text-sm font-bold">Draft opening paragraph</p>
                  <p className="mt-1 text-xs text-muted-foreground">30 min · writing</p>
                </div>
              </div>
            </div>
            <p className="mt-8 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Your plan should be a place to begin, not another thing to manage.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-paper/55">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="max-w-2xl">
            <p className="schedule-label text-[11px] font-bold uppercase text-primary">The planning loop</p>
            <h2 className="mt-3 font-heading text-4xl font-extrabold">From brief to next move.</h2>
          </div>
          <div className="mt-10 grid gap-0 md:grid-cols-3 md:divide-x md:divide-border">
            {steps.map(([number, title, description]) => (
              <article key={number} className="border-b border-border py-7 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
                <p className="schedule-label text-xs font-bold text-destructive">{number}</p>
                <h3 className="mt-5 font-heading text-xl font-extrabold">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
