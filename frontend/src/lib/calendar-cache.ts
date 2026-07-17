import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";
import type { ApiEvent } from "@/pages/Calendar/types";

const EVENTS_PREFIX = "task-genie:calendar-events:";
const INVALIDATION_PREFIX = "task-genie:calendar-events-version:";
const LOADED_PREFIX = "task-genie:calendar-events-loaded-version:";
const LEGACY_DIRTY_PREFIX = "task-genie:calendar-events-dirty:";

export type CalendarCacheSnapshot = {
  events: ApiEvent[] | null;
  isDirty: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type CalendarSubscriber = (snapshot: CalendarCacheSnapshot) => void;

const memorySnapshots = new Map<string, ApiEvent[]>();
const memoryInvalidationTokens = new Map<string, string>();
const memoryLoadedTokens = new Map<string, string>();
const inFlightRefreshes = new Map<string, Promise<ApiEvent[]>>();
const subscribers = new Map<string, Set<CalendarSubscriber>>();
const refreshErrors = new Map<string, string>();

function eventsKey(userId: string) {
  return `${EVENTS_PREFIX}${userId}`;
}

function invalidationKey(userId: string) {
  return `${INVALIDATION_PREFIX}${userId}`;
}

function loadedKey(userId: string) {
  return `${LOADED_PREFIX}${userId}`;
}

function legacyDirtyKey(userId: string) {
  return `${LEGACY_DIRTY_PREFIX}${userId}`;
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // The in-memory snapshot still keeps the current tab functional.
    return false;
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in privacy modes; memory state remains authoritative.
  }
}

function invalidationToken(userId: string) {
  const memoryToken = memoryInvalidationTokens.get(userId);
  if (memoryToken) return memoryToken;
  const storedToken = readStorage(invalidationKey(userId));
  const token =
    storedToken ??
    (readStorage(legacyDirtyKey(userId)) === "1" ? "legacy-dirty" : "base");
  memoryInvalidationTokens.set(userId, token);
  return token;
}

function loadedToken(userId: string) {
  const memoryToken = memoryLoadedTokens.get(userId);
  if (memoryToken) return memoryToken;
  const token = readStorage(loadedKey(userId)) ?? "base";
  memoryLoadedTokens.set(userId, token);
  return token;
}

function newInvalidationToken() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function isApiEvent(value: unknown): value is ApiEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ApiEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.start === "string" &&
    typeof event.end === "string"
  );
}

function parseEvents(value: unknown): ApiEvent[] | null {
  return Array.isArray(value) && value.every(isApiEvent) ? value : null;
}

function persistSnapshot(userId: string, events: ApiEvent[], token: string) {
  memorySnapshots.set(userId, events);
  memoryInvalidationTokens.set(userId, token);
  memoryLoadedTokens.set(userId, token);

  const storedEvents = writeStorage(eventsKey(userId), JSON.stringify(events));
  writeStorage(invalidationKey(userId), token);
  if (storedEvents) {
    writeStorage(loadedKey(userId), token);
  } else {
    // Never pair an old persisted payload with a newly-clean loaded token.
    removeStorage(eventsKey(userId));
    removeStorage(loadedKey(userId));
  }
  removeStorage(legacyDirtyKey(userId));
}

function notifySubscribers(userId: string) {
  const snapshot = getCalendarSnapshot(userId);
  for (const subscriber of subscribers.get(userId) ?? []) {
    subscriber(snapshot);
  }
}

export function getCachedCalendarEvents(userId: string): ApiEvent[] | null {
  const memorySnapshot = memorySnapshots.get(userId);
  if (memorySnapshot) return memorySnapshot;

  const stored = readStorage(eventsKey(userId));
  if (!stored) return null;
  try {
    const parsed = parseEvents(JSON.parse(stored));
    if (!parsed) {
      removeStorage(eventsKey(userId));
      return null;
    }
    memorySnapshots.set(userId, parsed);
    return parsed;
  } catch {
    removeStorage(eventsKey(userId));
    return null;
  }
}

export function getCalendarSnapshot(userId: string): CalendarCacheSnapshot {
  const events = getCachedCalendarEvents(userId);
  return {
    events,
    isDirty: events === null || loadedToken(userId) !== invalidationToken(userId),
    isRefreshing: inFlightRefreshes.has(userId),
    error: refreshErrors.get(userId) ?? null,
  };
}

export function invalidateCalendarCache(userId: string) {
  const nextToken = newInvalidationToken();
  memoryInvalidationTokens.set(userId, nextToken);
  writeStorage(invalidationKey(userId), nextToken);
  removeStorage(legacyDirtyKey(userId));
  refreshErrors.delete(userId);
  notifySubscribers(userId);
  if (subscribers.has(userId) && auth.currentUser?.uid === userId) {
    void ensureCalendarFresh(userId).catch(() => undefined);
  }
}

export function clearCalendarCache(userId: string) {
  memorySnapshots.delete(userId);
  memoryInvalidationTokens.delete(userId);
  memoryLoadedTokens.delete(userId);
  refreshErrors.delete(userId);
  removeStorage(eventsKey(userId));
  removeStorage(invalidationKey(userId));
  removeStorage(loadedKey(userId));
  removeStorage(legacyDirtyKey(userId));
  notifySubscribers(userId);
}

export function subscribeCalendarCache(
  userId: string,
  subscriber: CalendarSubscriber,
) {
  const userSubscribers = subscribers.get(userId) ?? new Set<CalendarSubscriber>();
  userSubscribers.add(subscriber);
  subscribers.set(userId, userSubscribers);
  subscriber(getCalendarSnapshot(userId));

  return () => {
    userSubscribers.delete(subscriber);
    if (userSubscribers.size === 0) subscribers.delete(userId);
  };
}

async function refreshUntilCurrent(userId: string) {
  while (true) {
    if (auth.currentUser?.uid !== userId) {
      throw new Error("The active user changed before the calendar refresh started.");
    }

    const requestedToken = invalidationToken(userId);
    const response = await apiFetch("/api/events");
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.status}`);
    }
    const events = parseEvents(await response.json());
    if (!events) throw new Error("The calendar API returned invalid event data.");
    if (auth.currentUser?.uid !== userId) {
      throw new Error("The active user changed during the calendar refresh.");
    }

    // A mutation during this request makes its response non-authoritative. Fetch the
    // newer generation instead of letting stale data clear the invalidation marker.
    if (invalidationToken(userId) !== requestedToken) continue;

    persistSnapshot(userId, events, requestedToken);
    refreshErrors.delete(userId);
    return events;
  }
}

export function ensureCalendarFresh(userId: string): Promise<ApiEvent[]> {
  const snapshot = getCalendarSnapshot(userId);
  if (!snapshot.isDirty && snapshot.events) return Promise.resolve(snapshot.events);

  const existingRefresh = inFlightRefreshes.get(userId);
  if (existingRefresh) return existingRefresh;

  const refresh = refreshUntilCurrent(userId)
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to refresh calendar events.";
      refreshErrors.set(userId, message);
      throw error;
    })
    .finally(() => {
      if (inFlightRefreshes.get(userId) === refresh) {
        inFlightRefreshes.delete(userId);
      }
      notifySubscribers(userId);
    });

  inFlightRefreshes.set(userId, refresh);
  notifySubscribers(userId);
  return refresh;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    const key = event.key;
    if (!key) return;
    const prefix = [EVENTS_PREFIX, INVALIDATION_PREFIX, LOADED_PREFIX].find((candidate) =>
      key.startsWith(candidate),
    );
    if (!prefix) return;

    const userId = key.slice(prefix.length);
    if (prefix === EVENTS_PREFIX) memorySnapshots.delete(userId);
    if (prefix === INVALIDATION_PREFIX) memoryInvalidationTokens.delete(userId);
    if (prefix === LOADED_PREFIX) memoryLoadedTokens.delete(userId);
    notifySubscribers(userId);

    // Cross-tab mutations are already committed when their invalidation is broadcast.
    if (
      prefix === INVALIDATION_PREFIX &&
      subscribers.has(userId) &&
      auth.currentUser?.uid === userId
    ) {
      void ensureCalendarFresh(userId).catch(() => undefined);
    }
  });
}
