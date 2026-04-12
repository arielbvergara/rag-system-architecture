"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { NearbyRestaurant } from "@/types";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";

function RestaurantCard({ restaurant }: { restaurant: NearbyRestaurant }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2">
      <h2
        className="text-base font-bold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-family-heading)" }}
      >
        {restaurant.name}
      </h2>
      {restaurant.description && (
        <p className="text-sm text-[var(--muted)] leading-relaxed">{restaurant.description}</p>
      )}
      <a
        href={restaurant.mapsUrl}
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

function NearbyRestaurantsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-[var(--border)] space-y-2">
          <SkeletonPulse className="h-5 w-48" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
          <SkeletonPulse className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function NearbyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRestaurants() {
      const response = await api.nearbyRestaurants.getList();
      if (response.success && response.data) {
        setRestaurants(response.data);
      } else {
        setError(response.error ?? "Failed to load nearby restaurants");
      }
      setLoading(false);
    }
    loadRestaurants();
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">

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
            Nearby Restaurants Without a Website
          </h1>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Restaurants within 5 km of Merckenburg 10, Amsterdam with no website — potential clients.
          </p>
        </div>

        <ErrorAlert error={error} />

        {loading && <NearbyRestaurantsSkeleton />}

        {!loading && !error && restaurants.length === 0 && (
          <InfoBanner message="No restaurants without a website were found within 5 km of this location." />
        )}

        {!loading && !error && restaurants.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
              {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} found
            </p>
            {restaurants.map((restaurant, index) => (
              <RestaurantCard key={`${restaurant.name}-${index}`} restaurant={restaurant} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
