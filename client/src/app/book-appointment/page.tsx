"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { api, CreateEventPayload } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormField } from "@/components/ui/FormField";
import { FormSuccessBanner } from "@/components/ui/FormSuccessBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimeSlotPicker, TimeSlot } from "@/components/ui/TimeSlotPicker";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { WORKING_HOURS_LABEL, generateHourlySlots } from "@/constants/workingHours";

const SPECIALTIES = [
  "General Practitioner",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedist",
  "Pediatrician",
  "Psychiatrist",
];

const DURATIONS: { label: string; minutes: number }[] = [
  { label: "30 minutes", minutes: 30 },
  { label: "60 minutes", minutes: 60 },
  { label: "90 minutes", minutes: 90 },
];

const SLOT_DURATION_HOURS = 1;

interface SuccessData {
  summary: string;
  start: string;
  end: string;
  htmlLink?: string;
}

function slotIsBooked(
  slotTime: string,
  date: string,
  events: { start?: { dateTime?: string }; end?: { dateTime?: string } }[]
): boolean {
  const [hours, minutes] = slotTime.split(":").map(Number);
  const slotStart = new Date(`${date}T${slotTime}:00`);
  slotStart.setHours(hours, minutes, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_HOURS * 60 * 60 * 1000);

  return events.some((event) => {
    const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : null;
    const eventEnd = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    if (!eventStart || !eventEnd) return false;
    return eventStart < slotEnd && eventEnd > slotStart;
  });
}

export default function BookAppointmentPage() {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  async function handleDateChange(
    value: string,
    schedule: { start: string; end: string } | null
  ) {
    setDate(value);
    setTime("");
    setSlots([]);

    if (!value || !schedule) return;

    const slotTimes = generateHourlySlots(schedule);
    setSlotsLoading(true);

    const res = await api.calendar.listEvents(50, value);
    setSlotsLoading(false);

    const events = (res.success && Array.isArray(res.data) ? res.data : []) as {
      start?: { dateTime?: string };
      end?: { dateTime?: string };
    }[];

    const builtSlots: TimeSlot[] = slotTimes.map((t) => ({
      time: t,
      booked: slotIsBooked(t, value, events),
    }));

    setSlots(builtSlots);
    const firstAvailable = builtSlots.find((s) => !s.booked);
    setTime(firstAvailable?.time ?? "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

    const event: CreateEventPayload = {
      summary: `Dr. Appointment – ${specialty} (${name})`,
      description: notes || `Patient: ${name}\nSpecialty: ${specialty}`,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };

    const res = await api.calendar.createEvent(event);
    setLoading(false);

    if (res.success && res.data) {
      const data = res.data as any;
      setSuccess({
        summary: data.summary,
        start: data.start?.dateTime,
        end: data.end?.dateTime,
        htmlLink: data.htmlLink,
      });
    } else {
      setError(res.error || "Failed to book appointment");
    }
  }

  if (success) {
    return (
      <FormSuccessBanner
        title="Appointment Booked!"
        message={<strong>{success.summary}</strong>}
        onReset={() => setSuccess(null)}
        resetLabel="Book another"
        backHref="/calendar"
        backLabel="View calendar"
      >
        <p className="text-sm text-[var(--success)] mb-1">
          {new Date(success.start).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <p className="text-xs text-[var(--muted)] mb-6">
          until{" "}
          {new Date(success.end).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        {success.htmlLink && (
          <a
            href={success.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4 text-sm text-[var(--accent)] underline"
          >
            View in Google Calendar →
          </a>
        )}
      </FormSuccessBanner>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            Book Appointment
          </h1>
          <p className="mt-1 text-[var(--muted)]">Schedule a doctor appointment and block your calendar</p>
          <div className="mt-3">
            <InfoBanner message={WORKING_HOURS_LABEL} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
          <FormField label="Patient Name" required>
            <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </FormField>

          <FormField label="Doctor Specialty" required>
            <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {SPECIALTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <DatePicker
                value={date}
                onChange={handleDateChange}
                min={new Date()}
                required
              />
            </FormField>
            <FormField label="Time" required>
              <TimeSlotPicker
                slots={slots}
                value={time}
                onChange={setTime}
                loading={slotsLoading}
              />
            </FormField>
          </div>

          <FormField label="Duration">
            <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>{d.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes or reason for visit…" rows={3} />
          </FormField>

          <ErrorAlert error={error} />

          <SubmitButton loading={loading} label="Book Appointment" loadingLabel="Booking…" />
        </form>

        <div className="mt-6">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
