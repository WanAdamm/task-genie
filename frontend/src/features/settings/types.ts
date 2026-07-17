export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof weekdays)[number];

export type AvailabilityWindow = {
  start: string;
  end: string;
};

export type AvailabilityConfig = {
  timezone: string;
  weekly: Record<Weekday, AvailabilityWindow[]>;
  minimumBlockMinutes: number;
  maximumBlockMinutes: number;
  breakMinutes: number;
  maximumDailyMinutes: number;
};
