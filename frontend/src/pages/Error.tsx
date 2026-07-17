import { Link } from "react-router-dom";

export default function Error() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-background font-body text-foreground">
      {/* Main Content */}
      <main className="relative flex w-full max-w-6xl flex-1 flex-col items-center justify-center overflow-hidden px-6 py-10 md:px-8">
        {/* Error Card */}
        <div className="paper-panel relative z-10 w-full max-w-md rounded-xl border border-border p-6 text-center shadow-sm md:max-w-lg md:p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-primary relative">
              <span className="material-symbols-outlined text-5xl">
                heart_broken
              </span>
              <span className="absolute -top-1 -right-1 material-symbols-outlined text-xl text-muted-foreground animate-pulse">
                magic_button
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
            Something went wrong
          </h1>

          {/* Description */}
          <p className="mx-auto mb-6 max-w-sm text-base leading-relaxed text-muted-foreground md:text-lg">
            We hit an unexpected issue while loading this page. Please try again
            or head back to your dashboard.
          </p>

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button type="button" onClick={() => window.location.reload()} className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto">
              Try Again
            </button>

            <Link to="/dashboard" className="w-full rounded-xl border border-control-border bg-surface-container-low px-6 py-3 font-bold text-foreground active:scale-95 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto">
              Back to Dashboard
            </Link>
          </div>

          {/* AI Insight */}
          <div className="mt-8 border-t border-border pt-8">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-surface-container-low/80 p-4 text-left backdrop-blur-[20px]">
              <span className="material-symbols-outlined text-primary mt-0.5">
                lightbulb
              </span>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-primary">
                  AI Insight
                </p>
                <p className="text-sm text-muted-foreground">
                  This typically happens due to a temporary synchronization lag.
                  Your data remains secure and undisturbed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support text */}
        <div className="mt-8 text-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="material-symbols-outlined text-base">
              support_agent
            </span>
            Still having trouble?{" "}
            <a
              href="#"
              className="rounded-sm underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Contact Academic Support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
