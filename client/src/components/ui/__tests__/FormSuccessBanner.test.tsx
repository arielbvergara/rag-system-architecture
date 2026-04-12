import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormSuccessBanner } from "../FormSuccessBanner";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const DEFAULT_PROPS = {
  title: "Email Sent!",
  message: "Your email was sent successfully.",
  onReset: vi.fn(),
  resetLabel: "Send another",
  backHref: "/",
  backLabel: "Back to home",
};

describe("FormSuccessBanner", () => {
  it("render_ShouldDisplaySuccessIcon_WhenRendered", () => {
    render(<FormSuccessBanner {...DEFAULT_PROPS} />);
    expect(screen.getByRole("img", { name: "Success" })).toBeInTheDocument();
  });

  it("render_ShouldDisplayTitle_WhenRendered", () => {
    render(<FormSuccessBanner {...DEFAULT_PROPS} />);
    expect(screen.getByText("Email Sent!")).toBeInTheDocument();
  });

  it("render_ShouldDisplayMessage_WhenRendered", () => {
    render(<FormSuccessBanner {...DEFAULT_PROPS} />);
    expect(screen.getByText("Your email was sent successfully.")).toBeInTheDocument();
  });

  it("render_ShouldDisplayResetButton_WhenRendered", () => {
    render(<FormSuccessBanner {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: "Send another" })).toBeInTheDocument();
  });

  it("render_ShouldDisplayBackLink_WhenRendered", () => {
    render(<FormSuccessBanner {...DEFAULT_PROPS} />);
    const link = screen.getByRole("link", { name: "Back to home" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("onReset_ShouldCallOnReset_WhenResetButtonIsClicked", () => {
    const onReset = vi.fn();
    render(<FormSuccessBanner {...DEFAULT_PROPS} onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: "Send another" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("render_ShouldRenderChildren_WhenChildrenAreProvided", () => {
    render(
      <FormSuccessBanner {...DEFAULT_PROPS}>
        <p>Extra appointment details</p>
      </FormSuccessBanner>
    );
    expect(screen.getByText("Extra appointment details")).toBeInTheDocument();
  });
});
