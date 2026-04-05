export default function Error() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-on-background font-body">
      {/* Navbar (keep if you want, otherwise remove since you said it's already a component) */}
      <header className="w-full h-16 flex items-center px-6 md:px-8 bg-[#faf8ff] border-b border-outline-variant/10">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">auto_fix_high</span>
          </div>
          <span className="text-xl font-bold text-[#113069]">TaskGenie</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex w-full max-w-6xl flex-1 flex-col items-center justify-center overflow-hidden px-6 py-10 md:px-8">
        {/* Background blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary-container/20 rounded-full blur-[100px]" />

        {/* Error Card */}
        <div className="relative z-10 w-full max-w-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 text-center shadow-sm md:max-w-lg md:p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-primary relative">
              <span className="material-symbols-outlined text-5xl">
                heart_broken
              </span>
              <span className="absolute -top-1 -right-1 material-symbols-outlined text-xl text-tertiary animate-pulse">
                magic_button
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-headline text-3xl font-extrabold tracking-tight md:text-4xl">
            Something went wrong
          </h1>

          {/* Description */}
          <p className="mx-auto mb-6 max-w-sm text-base leading-relaxed text-on-surface-variant md:text-lg">
            We hit an unexpected issue while loading this page. Please try again
            or head back to your dashboard.
          </p>

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 py-3 font-bold text-on-primary shadow-lg hover:brightness-110 active:scale-95 sm:w-auto">
              Try Again
            </button>

            <button className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-6 py-3 font-bold text-on-surface active:scale-95 hover:bg-surface-container-high sm:w-auto">
              Back to Dashboard
            </button>
          </div>

          {/* AI Insight */}
          <div className="mt-8 border-t border-outline-variant/10 pt-8">
            <div className="flex items-start gap-4 rounded-xl border border-outline-variant/10 bg-surface/80 p-4 text-left backdrop-blur-[20px]">
              <span className="material-symbols-outlined text-primary mt-0.5">
                lightbulb
              </span>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-primary">
                  AI Insight
                </p>
                <p className="text-sm text-on-surface-variant">
                  This typically happens due to a temporary synchronization lag.
                  Your data remains secure and undisturbed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support text */}
        <div className="mt-8 text-center">
          <p className="flex items-center gap-2 text-sm text-[#113069]/40">
            <span className="material-symbols-outlined text-base">
              support_agent
            </span>
            Still having trouble?{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Contact Academic Support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
