import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TRANSITIONS } from "@/config/constants";

type LinkButtonVariant = "primary" | "secondary";

interface LinkButtonProps {
  href: string;
  variant?: LinkButtonVariant;
  children: ReactNode;
  className?: string;
}

const BASE_CLASS = "rounded-lg px-5 py-2.5 text-sm font-medium cursor-pointer";

const VARIANT_CLASSES: Record<LinkButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]",
};

export function LinkButton({ href, variant = "primary", children, className }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(BASE_CLASS, VARIANT_CLASSES[variant], TRANSITIONS.colors, className)}
    >
      {children}
    </Link>
  );
}
