import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const BASE_CLASS =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow duration-150";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE_CLASS} ${className ?? ""}`.trim()} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${BASE_CLASS} resize-none ${className ?? ""}`.trim()} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${BASE_CLASS} ${className ?? ""}`.trim()} {...props} />;
}
