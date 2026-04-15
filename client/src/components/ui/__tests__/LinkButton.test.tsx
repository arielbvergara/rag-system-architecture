import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LinkButton } from "../LinkButton";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("LinkButton", () => {
  it("render_ShouldRenderAsAnchor_WhenRendered", () => {
    const { getByRole } = render(<LinkButton href="/foo">Click</LinkButton>);
    expect(getByRole("link")).toBeTruthy();
  });

  it("render_ShouldApplyPrimaryStyles_WhenVariantIsPrimary", () => {
    const { getByRole } = render(
      <LinkButton href="/foo" variant="primary">Click</LinkButton>
    );
    const el = getByRole("link");
    expect(el).toHaveClass("bg-[var(--accent)]");
    expect(el).toHaveClass("text-white");
  });

  it("render_ShouldApplySecondaryStyles_WhenVariantIsSecondary", () => {
    const { getByRole } = render(
      <LinkButton href="/foo" variant="secondary">Click</LinkButton>
    );
    const el = getByRole("link");
    expect(el).toHaveClass("bg-[var(--surface)]");
    expect(el).toHaveClass("text-[var(--foreground)]");
  });

  it("render_ShouldDefaultToPrimary_WhenVariantPropIsOmitted", () => {
    const { getByRole } = render(<LinkButton href="/foo">Click</LinkButton>);
    expect(getByRole("link")).toHaveClass("bg-[var(--accent)]");
  });

  it("render_ShouldUseCorrectHref_WhenHrefProvided", () => {
    const { getByRole } = render(<LinkButton href="/documents">Go</LinkButton>);
    expect(getByRole("link")).toHaveAttribute("href", "/documents");
  });

  it("render_ShouldRenderChildren_WhenChildrenProvided", () => {
    const { getByText } = render(<LinkButton href="/">Label text</LinkButton>);
    expect(getByText("Label text")).toBeTruthy();
  });

  it("render_ShouldMergeClassName_WhenClassNamePropProvided", () => {
    const { getByRole } = render(
      <LinkButton href="/" className="mt-4">Click</LinkButton>
    );
    expect(getByRole("link")).toHaveClass("mt-4");
    expect(getByRole("link")).toHaveClass("rounded-lg");
  });
});
