import Stepper from "@/components/ui/stepper";
import { useState } from "react";

type Strategy = "frog" | "balanced" | "night";

export default function Settings() {
  const [level, setLevel] = useState(3);
  const [primaryAlert, setPrimaryAlert] = useState(14);
  const [secondaryAlert, setSecondaryAlert] = useState(14);

  const [strategy, setStrategy] = useState<Strategy>("balanced");

  return (
    <main className="min-h-screen overflow-y-auto bg-surface max-w-6xl mx-auto px-6 py-10 md:px-8">
      <header className="mb-6 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
          Settings & Reminders
        </h1>
        <p className="mt-2 text-lg text-on-surface-variant">
          Curate your cognitive environment and notification flow.
        </p>
      </header>

      <div className="max-w-4xl space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mail</span>
            <h2 className="text-xl font-bold text-on-surface">
              Email Notifications
            </h2>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-on-surface">Daily Digest</p>
                <p className="text-sm text-on-surface-variant">
                  Morning briefing of your tasks and upcoming exams.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  defaultChecked
                />
                <div className="relative h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-on-surface">Weekly Report</p>
                <p className="text-sm text-on-surface-variant">
                  Performance overview and time-allocation analytics.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="relative h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div className="space-y-1">
                <p className="font-bold text-on-surface">Deadline Alerts</p>
                <p className="text-sm text-on-surface-variant">
                  Critical notifications for tasks due within 24 hours.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  defaultChecked
                />
                <div className="relative h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              alarm
            </span>
            <h2 className="text-xl font-bold text-on-surface">
              Reminder Thresholds
            </h2>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-on-surface">
                    Primary Alert
                  </label>
                  <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-primary">
                    {primaryAlert} Days Before
                  </span>
                </div>

                <Stepper
                  value={primaryAlert}
                  onChange={setPrimaryAlert}
                  min={1}
                  max={14}
                />

                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                  <span>1 Day</span>
                  <span>7 Days</span>
                  <span>14 Days</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-on-surface">
                    Secondary Alert
                  </label>
                  <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-medium text-tertiary">
                    {secondaryAlert} Days Before
                  </span>
                </div>

                <Stepper
                  value={secondaryAlert}
                  onChange={setSecondaryAlert}
                  min={primaryAlert + 1}
                  max={30}
                />

                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
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
            <h2 className="text-xl font-bold text-on-surface">
              Calendar Sync Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
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
                  <p className="text-xs font-medium text-green-600">
                    Connected
                  </p>
                </div>
              </div>

              <button className="w-full rounded-xl bg-surface-container-low px-6 py-3 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
                Manage Sync
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              auto_awesome
            </span>
            <h2 className="text-xl font-bold text-on-surface">
              AI Personalization
            </h2>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-on-surface">
                  Task Difficulty Preference
                </h3>
                <p className="mb-4 text-sm text-on-surface-variant">
                  How should the AI suggest scheduling your most difficult
                  tasks?
                </p>
                
                <div className="flex flex-col gap-3 md:flex-row">
                  {/* Eat the Frog */}
                  <button
                    onClick={() => setStrategy("frog")}
                    className={`flex-1 rounded-xl px-6 py-3 text-sm transition-all
      ${
        strategy === "frog"
          ? "border border-outline-variant/10 bg-primary/5 font-bold text-primary"
          : "border border-outline-variant/20 bg-surface-container-low font-semibold text-on-surface hover:border-primary"
      }`}
                  >
                    Eat the Frog (Early)
                  </button>

                  {/* Balanced */}
                  <button
                    onClick={() => setStrategy("balanced")}
                    className={`flex-1 rounded-xl px-6 py-3 text-sm transition-all
      ${
        strategy === "balanced"
          ? "border border-outline-variant/10 bg-primary/5 font-bold text-primary"
          : "border border-outline-variant/20 bg-surface-container-low font-semibold text-on-surface hover:border-primary"
      }`}
                  >
                    Balanced Flow
                  </button>

                  {/* Night Owl */}
                  <button
                    onClick={() => setStrategy("night")}
                    className={`flex-1 rounded-xl px-6 py-3 text-sm transition-all
      ${
        strategy === "night"
          ? "border border-outline-variant/10 bg-primary/5 font-bold text-primary"
          : "border border-outline-variant/20 bg-surface-container-low font-semibold text-on-surface hover:border-primary"
      }`}
                  >
                    Night Owl Focus
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-sm md:p-8">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                  <span
                    className="material-symbols-outlined text-8xl"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    psychology
                  </span>
                </div>

                <div className="relative z-10">
                  <h4 className="mb-2 text-sm font-bold text-on-primary-container">
                    Confidence Scrubber
                  </h4>
                  <p className="mb-6 max-w-lg text-xs text-on-surface-variant">
                    Adjust how strictly the AI adheres to your predicted study
                    habits vs. experimenting with new peak performance times.
                  </p>

                  <Stepper value={level} onChange={setLevel} />

                  <div className="mt-2 flex justify-between">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      Strict Logic
                    </span>
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      Creative Insights
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-end gap-4 border-t border-outline-variant/10 pt-4">
          <button className="px-6 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface">
            Discard Changes
          </button>
          <button className="rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
            Save Preferences
          </button>
        </footer>
      </div>
    </main>
  );
}
