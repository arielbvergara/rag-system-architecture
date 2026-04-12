import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatePicker } from "../DatePicker";

describe("DatePicker", () => {
  it("DatePicker_ShouldShowPlaceholder_WhenNoValueProvided", () => {
    render(<DatePicker value="" onChange={() => undefined} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("DatePicker_ShouldShowFormattedDate_WhenValueProvided", () => {
    render(<DatePicker value="2026-03-30" onChange={() => undefined} />);
    // Mon Mar 30 2026 — formatted by toLocaleDateString
    expect(screen.getByLabelText(/Mon, Mar 30, 2026/i)).toBeInTheDocument();
  });

  it("DatePicker_ShouldOpenCalendar_WhenTriggerIsClicked", () => {
    render(<DatePicker value="" onChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: /select a date/i }));
    // DayPicker renders a grid when open
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("DatePicker_ShouldCloseCalendar_WhenClickedOutside", () => {
    render(
      <div>
        <DatePicker value="" onChange={() => undefined} />
        <button data-testid="outside">Outside</button>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /select a date/i }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
