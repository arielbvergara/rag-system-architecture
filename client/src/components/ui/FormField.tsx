import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}

export function FormField({ label, required, optional, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}{" "}
        {required && <span className="text-[var(--error)]">*</span>}
        {optional && <span className="text-[var(--muted)] font-normal">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
