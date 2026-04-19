export type ApiEvent = {
  id: string
  title: string
  category: string
  calendarId: string
  start: string
  end: string
  dateKey: string
  yearMonth: string
  weekKey: string
  status: string
  priority: string
  source: string
  isLocked: boolean
  assignmentId?: string | null
  conflict: {
    hasConflict: boolean
    reason?: string | null
  }
  meta: {
    estimatedMinutes: number
    actualMinutes: number
  }
  createdAt: string
  updatedAt: string
}