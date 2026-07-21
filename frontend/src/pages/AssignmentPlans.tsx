import type { AssignmentPlanSummary } from "@/features/assignments/types";
import { apiFetch } from "@/lib/api";
import { clearPlanWorkingCopy } from "@/lib/assignment-draft-cache";
import { useAuth } from "@/hooks/auth-context";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Could not load assignment plans.");
  return data as T;
}

export default function AssignmentPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<AssignmentPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void apiFetch("/api/assignment-plans")
      .then((response) =>
        readResponse<{ items: AssignmentPlanSummary[] }>(response),
      )
      .then((result) => {
        if (active) setPlans(result.items);
      })
      .catch((error_) => {
        if (active) setError(error_ instanceof Error ? error_.message : "Could not load plans.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const discard = async (plan: AssignmentPlanSummary) => {
    if (!confirm(`Discard the unfinished ${plan.assignmentType} for ${plan.courseName}?`)) return;
    try {
      await readResponse(
        await apiFetch(`/api/assignment-plans/${plan.planId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: plan.revision }),
        }),
      );
      if (user) clearPlanWorkingCopy(user.uid, plan.planId);
      setPlans((current) => current.filter((item) => item.planId !== plan.planId));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Could not discard the plan.");
    }
  };

  return (
    <div className="dashboard-page mx-auto w-full max-w-6xl text-foreground">
      <header className="dashboard-page-header border-b border-border pb-5">
        <p className="schedule-label text-xs font-bold uppercase text-muted-foreground">Assignment planner</p>
        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Continue your runway</h1>
            <p className="mt-1 text-sm text-muted-foreground">Resume an unfinished estimate or begin a new assignment.</p>
          </div>
          <button type="button" onClick={() => navigate("/dashboard/assignments/new")} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Plan a new assignment</button>
        </div>
      </header>

      <div className="dashboard-page-scroll pb-10 pt-6">
        {error && <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading unfinished plans...</p>
        ) : plans.length === 0 ? (
          <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <h2 className="font-heading text-xl font-bold">No unfinished assignments</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your next assignment blueprint will appear here until it reaches the calendar.</p>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.planId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">{plan.status.replace("_", " ")}</p>
                    <h2 className="mt-1 font-heading text-lg font-bold">{plan.courseName}</h2>
                    <p className="text-sm text-muted-foreground">{plan.assignmentType}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase text-muted-foreground">Updated {new Date(plan.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-5 text-xs font-semibold text-muted-foreground">Due {new Date(plan.dueDate).toLocaleString()}</p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => navigate(`/dashboard/assignments/${plan.planId}`)} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Continue</button>
                  <button type="button" onClick={() => void discard(plan)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-destructive">Discard</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
