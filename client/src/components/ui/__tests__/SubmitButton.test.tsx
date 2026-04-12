import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SubmitButton } from "../SubmitButton";

describe("SubmitButton", () => {
  it("render_ShouldDisplayLabel_WhenNotLoading", () => {
    render(<SubmitButton loading={false} label="Send Message" />);
    expect(screen.getByRole("button", { name: "Send Message" })).toBeInTheDocument();
  });

  it("render_ShouldDisplayLoadingLabel_WhenLoadingIsTrue", () => {
    render(<SubmitButton loading={true} label="Send Message" loadingLabel="Sending…" />);
    expect(screen.getByRole("button", { name: "Sending…" })).toBeInTheDocument();
  });

  it("render_ShouldUseDefaultLoadingLabel_WhenLoadingLabelIsNotProvided", () => {
    render(<SubmitButton loading={true} label="Send Message" />);
    expect(screen.getByRole("button", { name: "Sending…" })).toBeInTheDocument();
  });

  it("render_ShouldBeDisabled_WhenLoadingIsTrue", () => {
    render(<SubmitButton loading={true} label="Send Message" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("render_ShouldBeEnabled_WhenLoadingIsFalse", () => {
    render(<SubmitButton loading={false} label="Send Message" />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("render_ShouldHaveSubmitType_WhenRendered", () => {
    render(<SubmitButton loading={false} label="Send" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
