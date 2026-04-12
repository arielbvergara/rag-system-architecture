import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ErrorAlert } from "../ErrorAlert";

describe("ErrorAlert", () => {
  it("render_ShouldDisplayErrorMessage_WhenErrorIsProvided", () => {
    render(<ErrorAlert error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("render_ShouldRenderNothing_WhenErrorIsNull", () => {
    const { container } = render(<ErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("render_ShouldApplyErrorStyles_WhenErrorIsProvided", () => {
    render(<ErrorAlert error="Invalid email" />);
    const alert = screen.getByText("Invalid email");
    expect(alert).toHaveClass("text-[var(--error)]");
  });
});
