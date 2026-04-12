interface SubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel?: string;
}

export function SubmitButton({ loading, label, loadingLabel = "Sending…" }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
