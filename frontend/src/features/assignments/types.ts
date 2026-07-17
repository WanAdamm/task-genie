import type { ApiEvent } from "@/pages/Calendar/types";

export type PlanPriority = "low" | "medium" | "high";
export type SubtaskCategory = "deep_work" | "study" | "admin";

export type ClarificationQuestion = {
  id: string;
  question: string;
  reason: string;
};

export type GeneratedSubtask = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  category: SubtaskCategory;
  priority: PlanPriority;
  dependencies: string[];
  splittable: boolean;
  minimumBlockMinutes: number;
};

export type GeneratedDraft = {
  summary: string;
  assumptions: string[];
  subtasks: GeneratedSubtask[];
};

export type PlanResponse = {
  planId: string;
  status: "awaiting_answers" | "draft";
  revision: number;
  questions?: ClarificationQuestion[];
  draft?: GeneratedDraft;
};

export type SchedulePolicy = {
  allowOutsideWorkHours: boolean;
  additionalDailyMinutes: number;
  leaveUnscheduled: boolean;
};

export type ProposedEvent = {
  subtaskId: string;
  title: string;
  category: SubtaskCategory;
  priority: PlanPriority;
  start: string;
  end: string;
  estimatedMinutes: number;
};

export type ScheduleResponse = {
  status: "ready" | "infeasible" | "needs_availability";
  message?: string;
  requiredMinutes?: number;
  availableMinutes?: number;
  unscheduledMinutes?: number;
  proposedEvents?: ProposedEvent[];
  options?: Array<{ id: string; label: string; description: string }>;
};

export type ConfirmResponse = {
  status: "scheduled";
  events: ApiEvent[];
  unscheduledMinutes?: number;
};
