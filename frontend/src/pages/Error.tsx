export default function Error() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-on-background font-body">

      {/* Navbar (keep if you want, otherwise remove since you said it's already a component) */}
      <header className="w-full h-16 flex items-center px-8 bg-[#faf8ff]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">auto_fix_high</span>
          </div>
          <span className="text-xl font-bold text-[#113069]">
            TaskGenie
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center w-full px-6 py-12 relative overflow-hidden">

        {/* Background blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary-container/20 rounded-full blur-[100px]" />

        {/* Error Card */}
        <div className="relative z-10 w-full max-w-md lg:max-w-lg bg-surface-container-lowest rounded-xl p-8 md:p-12 text-center border border-outline-variant/10 shadow-[0_8px_32px_rgba(17,48,105,0.06)]">

          {/* Icon */}
          <div className="mb-8 flex justify-center">
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
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Something went wrong
          </h1>

          {/* Description */}
          <p className="text-on-surface-variant text-base md:text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            We hit an unexpected issue while loading this page. Please try again
            or head back to your dashboard.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-semibold shadow-lg hover:brightness-110 active:scale-95">
              Try Again
            </button>

            <button className="w-full sm:w-auto px-8 py-3.5 bg-surface-container-low text-on-surface rounded-xl font-semibold hover:bg-surface-container-high active:scale-95">
              Back to Dashboard
            </button>
          </div>

          {/* AI Insight */}
          <div className="mt-12 pt-8 border-t border-outline-variant/10">
            <div className="bg-surface/80 backdrop-blur-[20px] p-4 rounded-lg flex items-start gap-4 text-left border-l-4 border-primary">
              <span className="material-symbols-outlined text-primary mt-0.5">
                lightbulb
              </span>

              <div>
                <p className="text-xs font-semibold text-primary uppercase mb-1">
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
        <div className="mt-12 text-center">
          <p className="text-sm text-[#113069]/40 flex items-center gap-2">
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