# Calendar-Aware Scheduling Architecture

## Purpose

This document defines how TaskGenie should incorporate a user's existing schedule once external calendar integrations are available. Calendar data should inform schedule placement without exposing unnecessary event details to the LLM or making probabilistic output authoritative.

## Current Architecture

Gemini does not currently choose dates or times. It generates clarification questions and assignment subtasks in `backend/app/services/llm_planner.py`. The deterministic scheduler in `backend/app/services/scheduler.py` places those subtasks into calendar blocks.

Existing TaskGenie events are already converted into busy intervals in `backend/app/routes/assignment_plans.py` and passed to the scheduler. External calendar events should enter the same provider-neutral scheduling pipeline.

## Guiding Principle

```text
Google / Outlook / other provider
        |
        v
Provider adapter and synchronization
        |
        v
Provider-neutral busy schedule
        |
        v
Deterministic scheduler
        |
        v
Validated preview
        |
        v
Confirmed TaskGenie events
```

Raw calendar events should not be sent to the LLM or placed directly by it. Doing so would expose unnecessary titles, attendees, locations, and descriptions while still requiring deterministic conflict validation.

The separation of responsibilities should remain:

- The LLM decomposes assignments and estimates effort.
- Calendar adapters retrieve and normalize provider data.
- The deterministic scheduler selects dates and times.
- The backend validates and persists the final schedule.

## Provider-Neutral Busy Schedule

Extract the current busy-interval loading logic into a dedicated service. Its input should be the authenticated user and the exact planning horizon, and its output should include both intervals and freshness metadata.

```python
BusyScheduleSnapshot(
    range_start,
    range_end,
    timezone,
    busy_intervals,
    calendar_revision,
    coverage_end,
    last_synced_at,
    stale_connections,
)
```

The service should:

- Require timezone-aware range boundaries.
- Query only events overlapping `now` through the assignment deadline.
- Combine internal and external calendar occurrences.
- Ignore events that do not block scheduling.
- Normalize timed intervals to UTC.
- Convert all-day dates using the user's planning timezone.
- Clamp intervals to the requested planning horizon.
- Merge duplicate, adjacent, and overlapping busy intervals.
- Report stale, incomplete, or revoked provider connections.

The scheduler should continue receiving only normalized `BusyInterval` values and should remain unaware of Google, Outlook, OAuth, recurrence, or provider identifiers.

## Normalized External Events

Imported provider occurrences should use the existing user-scoped event collection while adding provider-neutral scheduling fields.

```json
{
  "start": "2026-07-22T13:00:00Z",
  "end": "2026-07-22T14:00:00Z",
  "busyStatus": "busy",
  "source": "external",
  "isReadOnly": true,
  "allDay": false,
  "timeZone": "America/New_York"
}
```

Provider IDs, sync tokens, recurrence metadata, ETags, and OAuth credentials must remain server-only. Public event responses should use an explicit response model rather than returning entire Firestore documents.

The normalized model should support:

- `busy`, `free`, and `tentative` availability states.
- Timed and all-day events.
- An IANA timezone for wall-clock and recurrence behavior.
- A server-controlled provider origin and connection identifier.
- Read-only external event projections.
- Stable recurring-series and occurrence identity.
- Deterministic document IDs for idempotent synchronization.

## Provider Semantics

Synchronization must handle provider-specific behavior before data reaches the scheduler:

- Transparent or free events do not block time.
- Declined invitations do not block time.
- Cancelled events are removed or tombstoned.
- Tentative events follow an explicit user preference.
- Recurring events are materialized into concrete occurrences over a bounded horizon.
- Moved and cancelled recurrence exceptions retain stable occurrence identity.
- All-day end dates remain exclusive.
- Duplicate events remain distinct records, while overlapping busy intervals are merged for scheduling.

The system must not fuzzy-merge events based only on title and time.

## Synchronization Coverage

Before previewing or confirming an assignment schedule, the backend must verify that enabled provider connections have synchronized through the assignment deadline.

If coverage is stale, incomplete, currently syncing, or requires reauthorization, planning should return a state such as `needs_calendar_sync`. It must not silently treat unknown time as free.

For an initial implementation, an on-demand provider FreeBusy query can provide privacy-preserving correctness. A materialized occurrence mirror is preferable when TaskGenie must display external events, support offline reads, or process provider webhooks.

## Calendar Revision Guard

Maintain a monotonic per-user calendar state document:

```text
users/{uid}/calendarState/current
```

```json
{
  "revision": 42,
  "updatedAt": "2026-07-21T15:00:00Z",
  "syncInProgress": false
}
```

The revision must change whenever busy time can change, including:

- Internal event creation, update, or deletion.
- Assignment-plan confirmation.
- Provider import, update, or deletion.
- Recurrence rematerialization.
- Calendar selection changes.
- Provider disconnection and data removal.

This revision closes the race between reading busy intervals and committing generated blocks.

## Immutable Schedule Previews

Schedule previews should be persisted rather than recomputed implicitly during confirmation. Each preview should record:

- Preview ID.
- Plan ID and plan revision.
- Scheduling policy.
- Exact proposed blocks.
- Planning timezone.
- Calendar revision.
- Settings revision.
- Scheduler version.
- Effective planning time.
- Provider coverage and freshness.
- Required, available, and unscheduled minutes.
- Generation timestamp.

Confirmation should accept a `previewId` and commit exactly the blocks displayed to the user. The transaction must verify that the plan, settings, and calendar revisions have not changed.

If any revision changed, return `409 preview_stale`, generate a replacement preview, and require the user to confirm the new times. Confirmation must never silently move blocks away from the displayed preview.

## Optional LLM Capacity Context

The LLM does not need calendar event details to produce a conflict-free schedule. If assignment decomposition should adapt to limited capacity, provide only a sanitized aggregate summary:

```json
{
  "daysRemaining": 6,
  "totalFreeMinutes": 480,
  "longestFreeBlockMinutes": 90,
  "freeMinutesByDay": {
    "2026-07-22": 120,
    "2026-07-23": 60
  }
}
```

This context can help Gemini produce smaller, splittable subtasks or identify an infeasible workload. It must not allow the LLM to reduce required work silently or choose final dates and times.

Any LLM-proposed scheduling recommendation must still be validated for:

- Existing-event overlap.
- User work windows.
- Daily limits.
- Minimum and maximum block lengths.
- Break requirements.
- Dependency order.
- Assignment deadlines.

## Connection and Credential Boundaries

Calendar-provider OAuth must remain separate from Firebase authentication. Connection state should be server-owned rather than accepted through ordinary user settings.

Recommended storage boundaries:

```text
users/{uid}/calendarConnections/{connectionId}
calendarCredentials/{connectionId}
calendarWebhookChannels/{channelId}
```

- User connection records contain safe status and synchronization metadata.
- Server-only credential records contain encrypted refresh tokens and provider subjects.
- Webhook-channel records map provider callbacks to internal users without trusting a URL user ID.

OAuth tokens, raw provider calendar IDs, attendees, locations, descriptions, and conference links must not be returned to the browser or written to the frontend calendar cache unless a later feature explicitly requires them.

## Synchronization Strategy

Provider synchronization should use:

- A paginated initial full synchronization.
- Per-calendar incremental sync tokens.
- Deterministic occurrence IDs for idempotent retries.
- Webhooks as hints to enqueue incremental synchronization.
- Periodic reconciliation because webhook delivery is not guaranteed.
- Generation staging so incomplete full synchronizations are never exposed as authoritative.
- Recovery from expired sync tokens with a calendar-scoped full resynchronization.

Before confirmation, either synchronize again or enforce a strict freshness threshold. Provider changes immediately after confirmation remain possible, so the system should detect and surface newly created conflicts rather than claiming absolute consistency.

## Source of Truth

| Data | Authority |
| --- | --- |
| Manual and AI-generated TaskGenie events | TaskGenie event collection |
| Imported external events | External provider |
| Provider event projection | Derived, read-only TaskGenie record |
| Provider copies of TaskGenie events | Derived external copies |
| OAuth credentials and sync cursors | Server-only integration storage |
| Provider-neutral busy schedule | Derived from normalized occurrences |
| Browser calendar cache | Disposable, eventually consistent cache |

Two-way synchronization must not create two equally authoritative mutable records. If TaskGenie later exports planned blocks, internal events should remain authoritative and external copies should be managed through an outbox and explicit provider mappings.

## Delivery Phases

### Phase 0: Provider-Neutral Foundation

1. Add all-day, timezone, busy-status, read-only, and provider-origin fields.
2. Make provider-origin fields server-controlled.
3. Add an explicit public event serializer.
4. Extract the range-based busy-schedule service.
5. Add calendar and settings revisions.
6. Persist immutable previews and guard confirmation.
7. Add required Firestore indexes.

### Phase 1: Read-Only Provider Integration

1. Add OAuth authorization and callback endpoints.
2. Store encrypted connection credentials separately.
3. Let users select calendars.
4. Import bounded provider occurrences or query FreeBusy on demand.
5. Ensure synchronization coverage through each assignment deadline.
6. Add manual synchronization, reauthorization, and disconnect controls.
7. Revalidate the frontend calendar cache by revision or TTL.

### Phase 2: Durable Incremental Synchronization

1. Add provider-resource mirrors for recurrence masters and exceptions.
2. Store per-calendar sync tokens.
3. Add durable background synchronization jobs.
4. Add webhook receivers and channel renewal.
5. Add periodic reconciliation and stale-connection handling.

### Phase 3: Optional Plan Export

1. Request provider write scope only when export is enabled.
2. Add a durable export outbox.
3. Map internal events to provider copies.
4. Use conditional writes and provider versions.
5. Detect external divergence instead of silently using last-write-wins behavior.

True bidirectional editing should remain a separate feature with explicit field ownership and conflict-resolution rules.

## Required Tests

At minimum, automated coverage should verify:

- Internal and external events prevent overlapping generated blocks.
- Free, transparent, declined, and cancelled events do not block time.
- Tentative-event behavior follows user preferences.
- Recurring normal, moved, and cancelled occurrences are handled correctly.
- Single-day and multi-day all-day events use exclusive end dates.
- Timed recurrence remains correct across DST transitions.
- Synchronization is idempotent across retries and duplicate webhooks.
- A stale or revoked connection prevents silent scheduling.
- A provider update between preview and confirmation returns `preview_stale`.
- Concurrent confirmations cannot claim the same free interval unnoticed.
- Provider metadata does not leak through event APIs or browser storage.
- Scheduling remains deterministic for identical inputs and context versions.

Property-based scheduler tests should enforce that generated blocks never overlap busy intervals or each other, remain within allowed windows, respect dependencies and deadlines, and account for all required work.

## Recommended Default

Use busy-only read access by default. Full external event titles and details should be explicit opt-in functionality and are not required for schedule generation.
