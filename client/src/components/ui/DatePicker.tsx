"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { getScheduleForDay } from "@/constants/workingHours";

const CALENDAR_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 shrink-0"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CHEVRON_LEFT = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string, schedule: { start: string; end: string } | null) => void;
  min?: Date;
  required?: boolean;
}

export function DatePicker({ value, onChange, min, required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = min ?? new Date();
  today.setHours(0, 0, 0, 0);

  const selected = value ? new Date(`${value}T12:00:00`) : undefined;

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const schedule = getScheduleForDay(date.getDay());
    onChange(`${yyyy}-${mm}-${dd}`, schedule);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        aria-label={displayValue || "Select a date"}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" || e.key === " " ? setOpen((o) => !o) : undefined}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow duration-150 cursor-pointer flex items-center justify-between gap-2"
      >
        <span className={displayValue ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {displayValue || "Select a date"}
        </span>
        <span className="text-[var(--muted)]">{CALENDAR_ICON}</span>
      </div>

      {/* Hidden input so native `required` validation fires when the form submits */}
      <input
        type="text"
        tabIndex={-1}
        required={required}
        value={displayValue}
        readOnly
        aria-hidden="true"
        className="sr-only"
        onChange={() => undefined}
      />

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-3 min-w-[280px]">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={[{ dayOfWeek: [0, 6] }, { before: today }]}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? CHEVRON_LEFT : CHEVRON_RIGHT,
            }}
            classNames={{
              root: "select-none",
              months: "flex flex-col",
              month: "w-full",
              month_caption: "flex items-center justify-between mb-3 px-1",
              caption_label: "text-sm font-semibold text-[var(--foreground)]",
              nav: "flex gap-1",
              button_previous:
                "p-1 rounded-md hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors",
              button_next:
                "p-1 rounded-md hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors",
              month_grid: "w-full border-collapse",
              weekdays: "mb-1",
              weekday:
                "text-xs text-[var(--muted)] font-medium text-center w-9 pb-1 inline-block",
              week: "flex",
              day: "p-0",
              day_button:
                "w-9 h-9 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--border)] transition-colors cursor-pointer flex items-center justify-center mx-auto",
              selected:
                "!bg-[var(--accent)] !text-white hover:!bg-[var(--accent-hover)] rounded-lg",
              today: "font-semibold text-[var(--accent)]",
              disabled:
                "!text-[var(--muted)] opacity-30 cursor-not-allowed hover:!bg-transparent",
              outside: "opacity-30",
              hidden: "invisible",
            }}
          />
        </div>
      )}
    </div>
  );
}
