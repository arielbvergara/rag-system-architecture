import { ReactNode } from "react";
import Link from "next/link";

interface FormSuccessBannerProps {
  title: string;
  message: ReactNode;
  onReset: () => void;
  resetLabel: string;
  backHref: string;
  backLabel: string;
  children?: ReactNode;
}

export function FormSuccessBanner({
  title,
  message,
  onReset,
  resetLabel,
  backHref,
  backLabel,
  children,
}: FormSuccessBannerProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--success-bg)] p-8 text-center shadow-sm">
          <div
            className="w-16 h-16 rounded-full bg-[var(--success)] flex items-center justify-center mx-auto mb-4"
            role="img"
            aria-label="Success"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-[var(--foreground)] mb-2"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            {title}
          </h1>
          <div className="text-[var(--muted)] mb-6">{message}</div>
          {children}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onReset}
              className="rounded-lg border border-[var(--success-border)] px-4 py-2 text-sm font-medium text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors duration-150 cursor-pointer"
            >
              {resetLabel}
            </button>
            <Link
              href={backHref}
              className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity duration-150 cursor-pointer"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
