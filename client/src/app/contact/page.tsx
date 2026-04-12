"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { api, ContactRowPayload } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormField } from "@/components/ui/FormField";
import { FormSuccessBanner } from "@/components/ui/FormSuccessBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input, Textarea } from "@/components/ui/Input";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const row: ContactRowPayload = { name, email, phone: phone || undefined, message };
    const res = await api.sheets.appendRow(row);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || "Failed to send message");
    }
  }

  function handleReset() {
    setSuccess(false);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  }

  if (success) {
    return (
      <FormSuccessBanner
        title="Message Received!"
        message={
          <>
            Thanks, <strong>{name}</strong>! Your contact request has been registered. We&apos;ll
            get back to you at <strong>{email}</strong> shortly.
          </>
        }
        onReset={handleReset}
        resetLabel="Send another"
        backHref="/"
        backLabel="Back to home"
      />
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
            Contact Us
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Send us a message — your request will be logged to a Google Sheet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
          <FormField label="Full Name" required>
            <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </FormField>

          <FormField label="Email" required>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </FormField>

          <FormField label="Phone" optional>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </FormField>

          <FormField label="Message" required>
            <Textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help you?" rows={4} />
          </FormField>

          <ErrorAlert error={error} />

          <SubmitButton loading={loading} label="Send Message" loadingLabel="Sending…" />
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
