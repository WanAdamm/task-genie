export default function Insights() {
  return (
    <div className="dashboard-page mx-auto max-w-6xl text-foreground">
      {/* Header */}
      <header className="dashboard-page-header flex w-full flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="schedule-label text-[10px] font-bold uppercase text-muted-foreground">Planning review</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Academic roadmap</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* TODO: Connect plan editing and calendar synchronization actions. */}
          <button type="button" className="rounded-xl border border-control-border bg-paper px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            Edit Plan
          </button>
          <button type="button" className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Sync Calendar
          </button>
        </div>
      </header>

      <div className="dashboard-page-scroll">
        <div className="w-full space-y-8 pb-10 pt-6">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Summary */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8 lg:col-span-2">
          <div className="flex justify-between">
            <div>
              <span className="rounded-xl bg-surface-container-high px-2 py-1 text-xs text-foreground">
                Current Focus
              </span>
              <h2 className="text-xl font-bold mt-2">
                Modernist Architecture & Urban Planning
              </h2>
              <p className="text-sm text-muted-foreground">
                ARC-402: Advanced Theory & Criticism
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Final Deadline</p>
              <p className="text-lg font-bold text-destructive">Dec 14, 2024</p>
            </div>
          </div>

          <div className="flex gap-6 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Effort</p>
              <p className="font-bold">42 Hours</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Complexity</p>
              <p>⭐⭐⭐⭐☆</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-success">On Track</p>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/10 p-6 shadow-sm md:p-8">
          <h3 className="font-bold flex items-center gap-2">
            ✨ Genie Analysis
          </h3>

          <p className="text-sm text-muted-foreground">
            You have a high concentration of deadlines in Phase 3.
            Redistributing effort earlier will reduce late-stage stress.
          </p>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Confidence</span>
              <span className="font-bold text-primary">94%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full">
              <div className="h-full bg-primary rounded-full w-[94%]" />
            </div>
          </div>
        </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h3 className="font-bold mb-6">Strategic Timeline</h3>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Oct 20 - Kickoff</span>
          <span>Nov 02 - Review</span>
          <span>Nov 18 - Draft</span>
          <span>Dec 01 - Peer Review</span>
          <span className="text-destructive font-bold">Dec 14 - Final</span>
        </div>

        <div className="mt-4 h-2 bg-surface-container-high rounded-full relative">
          <div className="absolute h-2 bg-primary w-[35%] rounded-full"></div>
        </div>
          </div>

          {/* Phases */}
          <div className="space-y-6">
        <h3 className="font-bold text-xl">Implementation Phases</h3>

        {/* Phase 1 */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h4 className="font-semibold">Phase 1: Research</h4>
          <p className="text-sm font-medium text-success">Completed (3/3)</p>
        </div>

        {/* Phase 2 */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h4 className="font-semibold">Phase 2: Planning</h4>
          <p className="text-sm text-primary">In Progress (1/4)</p>
        </div>

        {/* Phase 3 */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-container-low p-6 shadow-sm md:p-8">
          <h4 className="font-semibold">Phase 3: Drafting</h4>
          <p className="text-sm text-muted-foreground">Upcoming</p>
        </div>

        {/* Phase 4 */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-container-low p-6 shadow-sm md:p-8">
          <h4 className="font-semibold">Phase 4: Refinement</h4>
          <p className="text-sm text-muted-foreground">Final Stage</p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
