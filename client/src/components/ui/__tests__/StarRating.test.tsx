import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StarRating } from "../StarRating";

describe("StarRating", () => {
  it("render_ShouldDisplayRatingValue_WhenRatingIsProvided", () => {
    render(<StarRating rating={4.5} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("render_ShouldDisplayAccessibleLabel_WhenRatingIsProvided", () => {
    render(<StarRating rating={3} />);
    expect(screen.getByRole("img", { name: "3 out of 5 stars" })).toBeInTheDocument();
  });

  it("render_ShouldDisplayReviewCount_WhenTotalReviewsIsProvided", () => {
    render(<StarRating rating={4} totalReviews={287} />);
    expect(screen.getByText("(287 reviews)")).toBeInTheDocument();
  });

  it("render_ShouldNotDisplayReviewCount_WhenTotalReviewsIsNotProvided", () => {
    render(<StarRating rating={4} />);
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });

  it("render_ShouldClampRatingToFive_WhenRatingExceedsFive", () => {
    render(<StarRating rating={7} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
  });

  it("render_ShouldClampRatingToZero_WhenRatingIsBelowZero", () => {
    render(<StarRating rating={-2} />);
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("render_ShouldRenderFiveStarIcons_WhenRatingIsProvided", () => {
    const { container } = render(<StarRating rating={4} />);
    const svgs = container.querySelectorAll("[role='img'] svg");
    expect(svgs).toHaveLength(5);
  });

  it("render_ShouldFormatLargeReviewCount_WhenTotalReviewsIsOver1000", () => {
    render(<StarRating rating={4.5} totalReviews={1234} />);
    expect(screen.getByText("(1,234 reviews)")).toBeInTheDocument();
  });
});
