export default function Overview() {
  return (
    <main className="pt-24 px-6 pb-10 md:px-8">
      <header className="mb-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-on-surface font-headline mb-2 tracking-tight">
          Academic Pulse
        </h1>
        <p className="text-on-surface-variant font-medium">
          Welcome back, Julian. Your cognitive load is optimized for research
          today.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Overview Bento Grid */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deadline Card */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">
                  event_busy
                </span>
              </div>
              <div>
                <p className="text-4xl font-headline font-black text-on-surface">
                  3
                </p>
                <p className="text-[10px] uppercase text-on-surface-variant font-medium tracking-wider">
                  Deadlines this week
                </p>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  fact_check
                </span>
              </div>
              <div>
                <p className="text-4xl font-headline font-black text-on-surface">
                  12
                </p>
                <p className="text-[10px] uppercase text-on-surface-variant font-medium tracking-wider">
                  Tasks remaining
                </p>
              </div>
            </div>
          </div>

          {/* Focus Card */}
          <div className="bg-primary text-white p-6 md:p-8 rounded-xl relative overflow-hidden border border-outline-variant/10 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <p className="text-[10px] uppercase text-white/70 tracking-wider">
                Next Focus Session
              </p>
              <div>
                <p className="font-headline font-extrabold text-xl">
                  Research for CS101
                </p>
                <p className="text-sm text-white/80 mt-1">Today at 2:00 PM</p>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-8xl">
              bolt
            </span>
          </div>
        </div>

        {/* Load Analysis */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 md:p-8 rounded-xl border border-outline-variant/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-on-surface">
              Load Analysis
            </h3>
            <span className="material-symbols-outlined text-error">
              warning
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 flex items-center gap-3">
              <div className="w-2 h-12 bg-error rounded-full"></div>
              <div>
                <p className="text-xs font-bold text-on-surface">
                  High Workload Alert
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Macroeconomics Thesis is 40% behind projected milestone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-on-surface-variant">
                CAPACITY
              </span>

              <div className="flex-1 mx-4 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error w-[85%] rounded-full"></div>
              </div>

              <span className="text-[10px] font-black text-error">85%</span>
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-on-surface">
              Today's Focus
            </h2>
            <button className="text-primary text-xs font-bold hover:underline">
              Edit List
            </button>
          </div>

          <div className="space-y-3">
            {[
              { text: "Review Literature Review Structure", done: true },
              { text: "Annotate 4 peer-reviewed sources" },
              { text: "Draft introduction for Ethics paper" },
              { text: "Email Professor regarding Lab 4" },
            ].map((task, i) => (
              <label
                key={i}
                className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-xl border-2 border-outline-variant/10 flex items-center justify-center">
                  {task.done && (
                    <span className="material-symbols-outlined text-primary text-lg">
                      check
                    </span>
                  )}
                </div>

                <span
                  className={`text-sm ${
                    task.done ? "line-through opacity-50" : ""
                  }`}
                >
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Assignments */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-on-surface">
              Active Assignments
            </h2>
          </div>

          {[68, 22, 90].map((progress, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-sm"
            >
              <p className="font-bold mb-2">Assignment {i + 1}</p>

              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
