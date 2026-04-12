interface ErrorAlertProps {
  error: string | null;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-sm text-[var(--error)]">
      {error}
    </div>
  );
}
