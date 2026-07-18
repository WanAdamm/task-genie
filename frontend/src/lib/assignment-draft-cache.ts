import type {
  AssignmentInput,
  GeneratedDraft,
} from "@/features/assignments/types";

export type BlueprintDraft = Omit<AssignmentInput, "dueDate"> & { dueDate: string };

type PlanWorkingCopy = {
  revision: number;
  answers?: Record<string, string>;
  draft?: GeneratedDraft;
};

function blueprintKey(userId: string) {
  return `task-genie:assignment-blueprint:${userId}`;
}

function workingCopyKey(userId: string, planId: string) {
  return `task-genie:assignment-working-copy:${userId}:${planId}`;
}

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Server autosave remains authoritative when browser storage is unavailable.
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function getBlueprintDraft(userId: string) {
  return readJson<BlueprintDraft>(blueprintKey(userId));
}

export function saveBlueprintDraft(userId: string, draft: BlueprintDraft) {
  writeJson(blueprintKey(userId), draft);
}

export function clearBlueprintDraft(userId: string) {
  remove(blueprintKey(userId));
}

export function getPlanWorkingCopy(userId: string, planId: string) {
  return readJson<PlanWorkingCopy>(workingCopyKey(userId, planId));
}

export function savePlanWorkingCopy(
  userId: string,
  planId: string,
  workingCopy: PlanWorkingCopy,
) {
  writeJson(workingCopyKey(userId, planId), workingCopy);
}

export function clearPlanWorkingCopy(userId: string, planId: string) {
  remove(workingCopyKey(userId, planId));
}
