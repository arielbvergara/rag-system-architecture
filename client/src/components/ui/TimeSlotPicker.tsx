const SELECT_CLASS =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow duration-150";

const SELECT_DISABLED_CLASS =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] cursor-not-allowed opacity-60";

export interface TimeSlot {
  time: string;
  booked: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  value: string;
  onChange: (time: string) => void;
  loading?: boolean;
}

export function TimeSlotPicker({ slots, value, onChange, loading = false }: TimeSlotPickerProps) {
  if (loading) {
    return (
      <select disabled className={SELECT_DISABLED_CLASS}>
        <option>Checking availability…</option>
      </select>
    );
  }

  if (slots.length === 0) {
    return (
      <select disabled className={SELECT_DISABLED_CLASS}>
        <option>Select a date first</option>
      </select>
    );
  }

  return (
    <select
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={SELECT_CLASS}
    >
      {slots.map((slot) => (
        <option key={slot.time} value={slot.time} disabled={slot.booked}>
          {slot.time}{slot.booked ? " (booked)" : ""}
        </option>
      ))}
    </select>
  );
}
