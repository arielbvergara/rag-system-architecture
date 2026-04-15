import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)]${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
