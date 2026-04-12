import type { PlaceReview } from "@/types";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: PlaceReview;
}

function AuthorAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0 text-sm font-semibold"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-3">
        <AuthorAvatar name={review.authorName} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
            {review.authorName}
          </p>
          <p className="text-xs text-[var(--muted)]">{review.relativeTimeDescription}</p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.text && (
        <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-3">{review.text}</p>
      )}
    </article>
  );
}
