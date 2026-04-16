import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { TRANSITIONS } from "@/config/constants";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const BASE_CLASSES = "rounded-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--border)]",
  danger: "bg-[var(--error)] text-white hover:opacity-90",
  ghost: "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

/**
 * Reusable button component with multiple variants and sizes.
 *
 * @example
 * <Button variant="primary">Save</Button>
 * <Button variant="secondary" size="sm">Cancel</Button>
 * <Button loading>Submitting...</Button>
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        TRANSITIONS.colors,
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
