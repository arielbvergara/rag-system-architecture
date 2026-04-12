"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { WORKING_HOURS_LABEL } from "@/constants/workingHours";

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

function formatDateTime(dt?: string, d?: string): string {
  const raw = dt || d;
  if (!raw) return "—";
  const date = new Date(raw);
  if (dt) {
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const LocationPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 inline-block shrink-0" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.calendar.listEvents(20).then((res) => {
      if (res.success && res.data) {
        setEvents(res.data as CalendarEvent[]);
      } else {
        setError(res.error || "Failed to load events");
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-family-heading)" }}
            >
              Calendar Events
            </h1>
            <p className="mt-1 text-[var(--muted)]">Upcoming events from your Google Calendar</p>
          </div>
          <Link
            href="/book-appointment"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors duration-150 cursor-pointer"
          >
            + Book Appointment
          </Link>
        </div>
        <InfoBanner message={WORKING_HOURS_LABEL} />

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[var(--border)] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-[var(--error)]">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-[var(--muted)] shadow-sm">
            No upcoming events found.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[var(--foreground)] truncate">
                      {event.summary || "(No title)"}
                    </h2>
                    {event.description && (
                      <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="mt-1 text-sm text-[var(--muted)] flex items-center gap-1">
                        <LocationPinIcon />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-[var(--muted)] shrink-0">
                    <div className="font-medium text-[var(--foreground)]">
                      {formatDateTime(event.start?.dateTime, event.start?.date)}
                    </div>
                    {event.end && (
                      <div className="text-xs text-[var(--muted)]">
                        until {formatDateTime(event.end.dateTime, event.end.date)}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
