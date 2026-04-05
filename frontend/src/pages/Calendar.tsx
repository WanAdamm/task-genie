export default function Calendar() {
  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 md:px-8">
      <header className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-on-surface-variant">
            <span>TaskGenie</span>
            <span className="material-symbols-outlined text-xs">
              chevron_right
            </span>
            <span className="font-semibold text-primary">
              Academic Calendar
            </span>
          </nav>

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

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-outline-variant/10 bg-surface-container-low p-1">
            <button className="rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-primary">
              Week
            </button>
            <button className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary shadow-sm">
              Timeline
            </button>
            <button className="rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-primary">
              Month
            </button>
          </div>

          <button className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 transition-transform active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-180">
              auto_awesome
            </span>
            Workload Rebalancer
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 space-y-6 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  September 2024
                </h3>

                <div className="flex items-center gap-1 rounded-xl border border-outline-variant/10 bg-surface-container-low px-2 py-1">
                  <button className="rounded-xl p-1 transition-colors hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-lg">
                      chevron_left
                    </span>
                  </button>
                  <button className="rounded-xl p-1 transition-colors hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-lg">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
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

            <div className="hide-scrollbar overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 border-b border-outline-variant/10">
                  <div className="border-r border-outline-variant/10 p-4 text-center text-[10px] uppercase tracking-tighter text-on-surface-variant/50">
                    GMT-5
                  </div>

                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Mon
                    </p>
                    <p className="font-headline text-lg font-extrabold">16</p>
                  </div>

                  <div className="bg-surface-container-low/50 p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-primary">
                      Tue
                    </p>
                    <p className="font-headline text-lg font-extrabold text-primary">
                      17
                    </p>
                  </div>

                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Wed
                    </p>
                    <p className="font-headline text-lg font-extrabold">18</p>
                  </div>

                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Thu
                    </p>
                    <p className="font-headline text-lg font-extrabold">19</p>
                  </div>

                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Fri
                    </p>
                    <p className="font-headline text-lg font-extrabold">20</p>
                  </div>

                  <div className="p-4 text-center opacity-40">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Sat
                    </p>
                    <p className="font-headline text-lg font-extrabold">21</p>
                  </div>

                  <div className="p-4 text-center opacity-40">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant/60">
                      Sun
                    </p>
                    <p className="font-headline text-lg font-extrabold">22</p>
                  </div>
                </div>

                <div className="relative grid h-[600px] grid-cols-8">
                  <div className="flex flex-col justify-between border-r border-outline-variant/10 py-4 text-center text-[11px] font-bold uppercase text-on-surface-variant/40">
                    <div>08:00 AM</div>
                    <div>10:00 AM</div>
                    <div>12:00 PM</div>
                    <div>02:00 PM</div>
                    <div>04:00 PM</div>
                    <div>06:00 PM</div>
                    <div>08:00 PM</div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10">
                    <div className="absolute left-2 right-2 top-[10%] h-[20%] rounded-xl border border-outline-variant/10 bg-tertiary-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-tertiary-container">
                        Seminar
                      </p>
                      <p className="text-xs font-bold leading-tight text-on-surface">
                        Quant Theory
                      </p>
                    </div>
                    <div className="absolute left-2 right-2 top-[45%] h-[25%] rounded-xl border border-outline-variant/10 bg-primary-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-primary-container">
                        Deep Work
                      </p>
                      <p className="text-xs font-bold leading-tight text-on-surface">
                        Thesis Review
                      </p>
                    </div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10 bg-surface-container-low/20">
                    <div className="absolute left-2 right-2 top-[15%] h-[15%] rounded-xl border border-outline-variant/10 bg-tertiary-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-tertiary-container">
                        Lecture
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        Data Arch
                      </p>
                    </div>

                    <div className="absolute left-2 right-2 top-[30%] z-10 flex h-[20%] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-error bg-error-container/20 p-3 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-xl text-error">
                        error
                      </span>
                      <p className="text-center text-[10px] font-bold uppercase text-error">
                        Scheduling Conflict
                      </p>
                    </div>

                    <div className="absolute left-4 right-4 top-[32%] h-[12%] rounded-xl border border-outline-variant/10 bg-primary p-2 shadow-sm">
                      <p className="text-[10px] font-bold uppercase text-white">
                        Study
                      </p>
                      <p className="text-[10px] text-white/90">Macro Econ</p>
                    </div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10">
                    <div className="absolute left-2 right-2 top-[50%] h-[35%] rounded-xl border border-outline-variant/10 bg-primary-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-primary-container">
                        Deep Work
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        Code Sprint
                      </p>
                    </div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10">
                    <div className="absolute left-2 right-2 top-[5%] h-[15%] rounded-xl border border-outline-variant/10 bg-secondary-container/50 p-3 opacity-60">
                      <p className="text-[10px] font-bold uppercase text-on-secondary-container">
                        Gym
                      </p>
                    </div>

                    <div className="absolute left-2 right-2 top-[25%] h-[20%] rounded-xl border border-outline-variant/10 bg-error-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-error-container">
                        Deadline
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        Ethics Draft
                      </p>
                    </div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10">
                    <div className="absolute left-2 right-2 top-[40%] h-[30%] rounded-xl border border-outline-variant/10 bg-primary-container/40 p-3">
                      <p className="text-[10px] font-bold uppercase text-on-primary-container">
                        Deep Work
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        Final Wrap
                      </p>
                    </div>
                  </div>

                  <div className="group relative border-r border-outline-variant/10 bg-surface-container-low/10" />
                  <div className="group relative bg-surface-container-low/10" />

                  <div className="pointer-events-none absolute left-0 top-[38%] z-20 flex w-full items-center">
                    <div className="-ml-1.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,83,219,0.5)]" />
                    <div className="h-[2px] flex-1 bg-primary/40" />
                  </div>
                </div>
              </div>
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

          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-[#113069] p-6 text-on-primary shadow-sm md:p-8">
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
