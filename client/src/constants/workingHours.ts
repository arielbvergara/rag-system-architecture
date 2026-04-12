export type DaySchedule = {
  days: number[]; // 0 = Sunday … 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export const WORKING_HOURS: DaySchedule[] = [
  { days: [1, 2, 3, 4], start: "09:00", end: "18:00" }, // Monday – Thursday
  { days: [5], start: "09:00", end: "12:00" }, // Friday
];

export const WORKING_HOURS_LABEL =
  "Mon–Thu 09:00–18:00  ·  Fri 09:00–12:00  ·  Closed weekends";

export function getScheduleForDay(day: number): DaySchedule | null {
  return WORKING_HOURS.find((schedule) => schedule.days.includes(day)) ?? null;
}

export function generateHourlySlots(schedule: Pick<DaySchedule, "start" | "end">): string[] {
  const startH = parseInt(schedule.start.split(":")[0], 10);
  const endH = parseInt(schedule.end.split(":")[0], 10);
  return Array.from({ length: endH - startH }, (_, i) =>
    String(startH + i).padStart(2, "0") + ":00"
  );
}
