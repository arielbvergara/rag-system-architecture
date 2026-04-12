import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InfoBanner } from "../InfoBanner";

describe("InfoBanner", () => {
  it("InfoBanner_ShouldRenderMessage_WhenProvided", () => {
    render(<InfoBanner message="Mon–Thu 09:00–18:00 · Fri 09:00–12:00 · Closed weekends" />);
    expect(
      screen.getByText("Mon–Thu 09:00–18:00 · Fri 09:00–12:00 · Closed weekends")
    ).toBeInTheDocument();
  });
});
