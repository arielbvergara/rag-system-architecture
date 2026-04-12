"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { PlaceDetails } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const PLACE_QUERY = "Sushi+Toyo+Takapuna,+Auckland,+New+Zealand";

const MAP_EMBED_URL = MAPS_API_KEY
  ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${PLACE_QUERY}&zoom=16`
  : `https://maps.google.com/maps?q=${PLACE_QUERY}&z=16&output=embed`;

function MapEmbed() {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-sm w-full aspect-[4/3] min-h-64">
      <iframe
        title="Sushi Toyo Takapuna location"
        src={MAP_EMBED_URL}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

function PlaceHeader({ details }: { details: PlaceDetails }) {
  return (
    <div className="space-y-2">
      <h2
        className="text-xl font-bold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-family-heading)" }}
      >
        {details.name}
      </h2>
      <StarRating rating={details.rating} totalReviews={details.totalReviews} size="md" />
      <div className="flex items-start gap-2 text-sm text-[var(--muted)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent)]"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{details.address}</span>
      </div>
      <a
        href={details.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        Open in Google Maps
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-3"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}

function ReviewsList({ reviews }: { details: PlaceDetails; reviews: PlaceDetails["reviews"] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
        Recent Reviews
      </h3>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {reviews.map((review, index) => (
          <ReviewCard key={`${review.authorName}-${index}`} review={review} />
        ))}
      </div>
    </div>
  );
}

function LocationSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonPulse className="w-full aspect-[4/3] min-h-64" />
      <div className="space-y-4">
        <SkeletonPulse className="h-7 w-48" />
        <SkeletonPulse className="h-5 w-40" />
        <SkeletonPulse className="h-4 w-64" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <SkeletonPulse key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LocationPage() {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      const response = await api.location.getDetails();
      if (response.success && response.data) {
        setDetails(response.data);
      } else {
        setError(response.error ?? "Failed to load location details");
      }
      setLoading(false);
    }
    loadDetails();
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page header */}
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            Our Location
          </h1>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Find us in Takapuna, Auckland — walk-ins welcome.
          </p>
        </div>

        {!MAPS_API_KEY && (
          <InfoBanner message="Map is running without a Google Maps API key. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to client/.env.local for full embed support." />
        )}

        <ErrorAlert error={error} />

        {loading && <LocationSkeleton />}

        {!loading && !error && details && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MapEmbed />
            <div className="space-y-5">
              <PlaceHeader details={details} />
              <div className="border-t border-[var(--border)]" />
              <ReviewsList details={details} reviews={details.reviews} />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
