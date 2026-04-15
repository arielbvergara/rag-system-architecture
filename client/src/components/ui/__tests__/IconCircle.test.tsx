import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IconCircle } from "../IconCircle";

describe("IconCircle", () => {
  it("render_ShouldApplyMediumSizeAndCircleShape_WhenDefaultPropsUsed", () => {
    const { container } = render(<IconCircle>icon</IconCircle>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("w-10");
    expect(el).toHaveClass("h-10");
    expect(el).toHaveClass("rounded-full");
  });

  it("render_ShouldApplySmallSize_WhenSizeIsSmall", () => {
    const { container } = render(<IconCircle size="sm">icon</IconCircle>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("w-8");
    expect(el).toHaveClass("h-8");
  });

  it("render_ShouldApplyLargeSize_WhenSizeIsLarge", () => {
    const { container } = render(<IconCircle size="lg">icon</IconCircle>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("w-12");
    expect(el).toHaveClass("h-12");
  });

  it("render_ShouldApplyRoundedFull_WhenShapeIsCircle", () => {
    const { container } = render(<IconCircle shape="circle">icon</IconCircle>);
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("render_ShouldApplyRoundedLg_WhenShapeIsSquare", () => {
    const { container } = render(<IconCircle shape="square">icon</IconCircle>);
    expect(container.firstChild).toHaveClass("rounded-lg");
  });

  it("render_ShouldRenderChildren_WhenChildrenProvided", () => {
    const { getByText } = render(<IconCircle>my-icon</IconCircle>);
    expect(getByText("my-icon")).toBeTruthy();
  });

  it("render_ShouldMergeClassName_WhenClassNamePropProvided", () => {
    const { container } = render(<IconCircle className="mb-4">icon</IconCircle>);
    expect(container.firstChild).toHaveClass("mb-4");
    expect(container.firstChild).toHaveClass("rounded-full");
  });
});
