const TOTAL_STARS = 5;

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const TEXT_SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

function StarIcon({
  fill,
  className,
}: {
  fill: "full" | "half" | "empty";
  className: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {fill === "full" && (
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        />
      )}
      {fill === "half" && (
        <>
          <defs>
            <linearGradient id="half-fill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="url(#half-fill)"
            stroke="currentColor"
            strokeWidth="1"
          />
        </>
      )}
      {fill === "empty" && (
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="1"
        />
      )}
    </svg>
  );
}

function getStarFill(starIndex: number, rating: number): "full" | "half" | "empty" {
  if (rating >= starIndex + 1) return "full";
  if (rating >= starIndex + 0.5) return "half";
  return "empty";
}

export function StarRating({ rating, totalReviews, size = "md" }: StarRatingProps) {
  const clampedRating = Math.min(Math.max(rating, 0), TOTAL_STARS);
  const starSizeClass = SIZE_CLASSES[size];
  const textSizeClass = TEXT_SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5 text-yellow-400"
        role="img"
        aria-label={`${clampedRating} out of ${TOTAL_STARS} stars`}
      >
        {Array.from({ length: TOTAL_STARS }, (_, i) => (
          <StarIcon key={i} fill={getStarFill(i, clampedRating)} className={starSizeClass} />
        ))}
      </div>
      <span className={`font-semibold text-[var(--foreground)] ${textSizeClass}`}>
        {clampedRating.toFixed(1)}
      </span>
      {totalReviews !== undefined && (
        <span className={`text-[var(--muted)] ${textSizeClass}`}>
          ({totalReviews.toLocaleString()} reviews)
        </span>
      )}
    </div>
  );
}
