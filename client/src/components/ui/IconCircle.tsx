import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconCircleSize = "sm" | "md" | "lg";
type IconCircleShape = "circle" | "square";

interface IconCircleProps {
  children: ReactNode;
  size?: IconCircleSize;
  shape?: IconCircleShape;
  className?: string;
}

const SIZE_CLASSES: Record<IconCircleSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const SHAPE_CLASSES: Record<IconCircleShape, string> = {
  circle: "rounded-full",
  square: "rounded-lg",
};

export function IconCircle({ children, size = "md", shape = "circle", className }: IconCircleProps) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        "bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}
