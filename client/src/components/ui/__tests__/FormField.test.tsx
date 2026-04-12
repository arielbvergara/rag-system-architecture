import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FormField } from "../FormField";

describe("FormField", () => {
  it("render_ShouldDisplayLabel_WhenRendered", () => {
    render(
      <FormField label="Full Name">
        <input type="text" />
      </FormField>
    );
    expect(screen.getByText("Full Name")).toBeInTheDocument();
  });

  it("render_ShouldShowRequiredAsterisk_WhenRequiredPropIsTrue", () => {
    render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("render_ShouldShowOptionalText_WhenOptionalPropIsTrue", () => {
    render(
      <FormField label="Phone" optional>
        <input type="tel" />
      </FormField>
    );
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("render_ShouldNotShowAsteriskOrOptional_WhenNeitherPropIsSet", () => {
    render(
      <FormField label="Notes">
        <textarea />
      </FormField>
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
  });

  it("render_ShouldRenderChildren_WhenProvided", () => {
    render(
      <FormField label="Username">
        <input type="text" placeholder="Enter username" />
      </FormField>
    );
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
  });
});
