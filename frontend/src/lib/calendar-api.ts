import { apiFetch } from "@/lib/api";
import {
  ensureCalendarFresh,
  invalidateCalendarCache,
} from "@/lib/calendar-cache";

type MutationPredicate = (responseBody: unknown) => boolean;

/**
 * Calendar mutations must pass through this boundary so successful server writes
 * cannot leave a clean but stale browser snapshot behind.
 */
export async function runCalendarMutation(
  userId: string,
  input: RequestInfo | URL,
  init: RequestInit,
  didMutate: MutationPredicate = () => true,
) {
  const response = await apiFetch(input, init);
  if (!response.ok) return response;

  const responseBody = await response.clone().json().catch(() => null);
  if (responseBody === null || didMutate(responseBody)) {
    invalidateCalendarCache(userId);
    // The mutation has already committed. A refresh failure must not be reported as
    // a failed mutation; the dirty generation makes Calendar retry on its next mount.
    await ensureCalendarFresh(userId).catch(() => undefined);
  }
  return response;
}

export function createCalendarEvent(
  userId: string,
  event: Record<string, unknown>,
) {
  return runCalendarMutation(userId, "/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}
