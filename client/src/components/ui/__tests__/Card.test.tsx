import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "../Card";

describe("Card", () => {
  it("render_ShouldApplyBaseClasses_WhenRendered", () => {
    const { container } = render(<Card>content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("rounded-xl");
    expect(el).toHaveClass("border");
    expect(el).toHaveClass("bg-[var(--surface)]");
  });

  it("render_ShouldMergeAdditionalClassName_WhenClassNamePropProvided", () => {
    const { container } = render(<Card className="p-6 space-y-4">content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("rounded-xl");
    expect(el).toHaveClass("p-6");
    expect(el).toHaveClass("space-y-4");
  });

  it("render_ShouldRenderChildren_WhenChildrenProvided", () => {
    const { getByText } = render(<Card>hello world</Card>);
    expect(getByText("hello world")).toBeTruthy();
  });

  it("render_ShouldNotAddExtraSpace_WhenClassNameIsUndefined", () => {
    const { container } = render(<Card>content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toMatch(/\s$/);
  });
});
