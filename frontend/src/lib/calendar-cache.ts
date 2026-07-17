import type { ApiEvent } from "@/pages/Calendar/types";

export const CALENDAR_CACHE_UPDATED = "task-genie:calendar-cache-updated";

function eventsKey(userId: string) {
  return `task-genie:calendar-events:${userId}`;
}

function dirtyKey(userId: string) {
  return `task-genie:calendar-events-dirty:${userId}`;
}

function emitCacheUpdate(userId: string) {
  window.dispatchEvent(
    new CustomEvent(CALENDAR_CACHE_UPDATED, { detail: { userId } }),
  );
}

export function getCachedCalendarEvents(userId: string): ApiEvent[] | null {
  const cached = localStorage.getItem(eventsKey(userId));
  if (!cached) return null;

  try {
    return JSON.parse(cached) as ApiEvent[];
  } catch {
    localStorage.removeItem(eventsKey(userId));
    return null;
  }
}

export function setCachedCalendarEvents(userId: string, events: ApiEvent[]) {
  localStorage.setItem(eventsKey(userId), JSON.stringify(events));
  localStorage.removeItem(dirtyKey(userId));
  emitCacheUpdate(userId);
}

export function mergeCachedCalendarEvents(userId: string, events: ApiEvent[]) {
  const current = getCachedCalendarEvents(userId) ?? [];
  const byId = new Map(current.map((event) => [event.id, event]));

  for (const event of events) {
    byId.set(event.id, event);
  }

  setCachedCalendarEvents(userId, Array.from(byId.values()));
}

export function markCalendarCacheDirty(userId: string) {
  localStorage.setItem(dirtyKey(userId), "1");
  emitCacheUpdate(userId);
}

export function shouldReloadCalendarCache(userId: string) {
  return (
    localStorage.getItem(dirtyKey(userId)) === "1" ||
    getCachedCalendarEvents(userId) === null
  );
}
