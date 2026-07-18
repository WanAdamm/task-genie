import type { ApiEvent } from "@/pages/Calendar/types";

export type PlanPriority = "low" | "medium" | "high";
export type SubtaskCategory = "deep_work" | "study" | "admin";
export type PlanStatus =
  | "awaiting_answers"
  | "draft"
  | "preview"
  | "scheduled"
  | "cancelled"
  | "expired";

export type AssignmentInput = {
  courseName: string;
  dueDate: string;
  assignmentType: string;
  priority: PlanPriority;
  difficulty: number;
  requirements: string;
};

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

export type StoredClarificationAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type PlanResponse = {
  planId: string;
  status: PlanStatus;
  revision: number;
  assignment: AssignmentInput;
  questions?: ClarificationQuestion[];
  answers?: StoredClarificationAnswer[];
  draft?: GeneratedDraft;
  policy?: SchedulePolicy;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentPlanSummary = {
  planId: string;
  status: PlanStatus;
  revision: number;
  courseName: string;
  assignmentType: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
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
  revision?: number;
};

export type ConfirmResponse = {
  status: "scheduled";
  events: ApiEvent[];
  unscheduledMinutes?: number;
};
