import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReviewCard } from "../ReviewCard";
import type { PlaceReview } from "@/types";

const MOCK_REVIEW: PlaceReview = {
  authorName: "Sarah Mitchell",
  rating: 5,
  text: "Absolutely incredible sushi! The salmon nigiri melts in your mouth.",
  relativeTimeDescription: "2 weeks ago",
};

describe("ReviewCard", () => {
  it("render_ShouldDisplayAuthorName_WhenReviewIsProvided", () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText("Sarah Mitchell")).toBeInTheDocument();
  });

  it("render_ShouldDisplayRelativeTime_WhenReviewIsProvided", () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText("2 weeks ago")).toBeInTheDocument();
  });

  it("render_ShouldDisplayReviewText_WhenReviewHasText", () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(
      screen.getByText("Absolutely incredible sushi! The salmon nigiri melts in your mouth.")
    ).toBeInTheDocument();
  });

  it("render_ShouldNotDisplayReviewText_WhenTextIsEmpty", () => {
    const review: PlaceReview = { ...MOCK_REVIEW, text: "" };
    const { container } = render(<ReviewCard review={review} />);
    const textParagraph = container.querySelector("p.text-sm.text-\\[var\\(--muted\\)\\]");
    expect(textParagraph).not.toBeInTheDocument();
  });

  it("render_ShouldDisplayFirstLetterOfAuthorName_WhenReviewIsProvided", () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("render_ShouldDisplayStarRating_WhenReviewIsProvided", () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByRole("img", { name: "5 out of 5 stars" })).toBeInTheDocument();
  });

  it("render_ShouldDisplayCorrectInitial_WhenAuthorNameStartsWithLowercase", () => {
    const review: PlaceReview = { ...MOCK_REVIEW, authorName: "jane doe" };
    render(<ReviewCard review={review} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });
});
