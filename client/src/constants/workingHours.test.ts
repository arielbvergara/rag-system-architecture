import { describe, it, expect } from "vitest";
import { getScheduleForDay, generateHourlySlots } from "./workingHours";

describe("getScheduleForDay", () => {
  it("getScheduleForDay_ShouldReturnWeekdaySchedule_WhenDayIsMonday", () => {
    const schedule = getScheduleForDay(1);
    expect(schedule).not.toBeNull();
    expect(schedule?.start).toBe("09:00");
    expect(schedule?.end).toBe("18:00");
  });

  it("getScheduleForDay_ShouldReturnWeekdaySchedule_WhenDayIsThursday", () => {
    const schedule = getScheduleForDay(4);
    expect(schedule).not.toBeNull();
    expect(schedule?.start).toBe("09:00");
    expect(schedule?.end).toBe("18:00");
  });

  it("getScheduleForDay_ShouldReturnFridaySchedule_WhenDayIsFriday", () => {
    const schedule = getScheduleForDay(5);
    expect(schedule).not.toBeNull();
    expect(schedule?.start).toBe("09:00");
    expect(schedule?.end).toBe("12:00");
  });

  it("getScheduleForDay_ShouldReturnNull_WhenDayIsSaturday", () => {
    expect(getScheduleForDay(6)).toBeNull();
  });

  it("getScheduleForDay_ShouldReturnNull_WhenDayIsSunday", () => {
    expect(getScheduleForDay(0)).toBeNull();
  });
});

describe("generateHourlySlots", () => {
  it("generateHourlySlots_ShouldReturnNineSlots_WhenScheduleIsMonThru", () => {
    const schedule = getScheduleForDay(1)!;
    const slots = generateHourlySlots(schedule);
    expect(slots).toHaveLength(9);
    expect(slots[0]).toBe("09:00");
    expect(slots[8]).toBe("17:00");
  });

  it("generateHourlySlots_ShouldReturnThreeSlots_WhenScheduleIsFriday", () => {
    const schedule = getScheduleForDay(5)!;
    const slots = generateHourlySlots(schedule);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toBe("09:00");
    expect(slots[2]).toBe("11:00");
  });
});
