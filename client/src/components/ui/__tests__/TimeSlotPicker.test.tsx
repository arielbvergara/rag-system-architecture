import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TimeSlotPicker, TimeSlot } from "../TimeSlotPicker";

const AVAILABLE_SLOTS: TimeSlot[] = [
  { time: "09:00", booked: false },
  { time: "10:00", booked: true },
  { time: "11:00", booked: false },
];

describe("TimeSlotPicker", () => {
  it("TimeSlotPicker_ShouldShowLoadingOption_WhenLoadingIsTrue", () => {
    render(
      <TimeSlotPicker slots={[]} value="" onChange={() => undefined} loading />
    );
    expect(screen.getByText("Checking availability…")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("TimeSlotPicker_ShouldShowPlaceholder_WhenNoSlotsProvided", () => {
    render(
      <TimeSlotPicker slots={[]} value="" onChange={() => undefined} />
    );
    expect(screen.getByText("Select a date first")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("TimeSlotPicker_ShouldRenderAllSlots_WhenSlotsAreProvided", () => {
    render(
      <TimeSlotPicker slots={AVAILABLE_SLOTS} value="09:00" onChange={() => undefined} />
    );
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("10:00 (booked)")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
  });

  it("TimeSlotPicker_ShouldDisableBookedSlot_WhenSlotIsBooked", () => {
    render(
      <TimeSlotPicker slots={AVAILABLE_SLOTS} value="09:00" onChange={() => undefined} />
    );
    const bookedOption = screen.getByText("10:00 (booked)") as HTMLOptionElement;
    expect(bookedOption.disabled).toBe(true);
  });
});
