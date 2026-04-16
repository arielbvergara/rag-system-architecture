import { cn } from "@/lib/utils";

interface SkeletonPulseProps {
  className?: string;
}

export function SkeletonPulse({ className = "h-4 w-full" }: SkeletonPulseProps) {
  return <div className={cn("animate-pulse rounded bg-[var(--border)]", className)} />;
}
