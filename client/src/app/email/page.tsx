"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { api, SendEmailPayload } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormField } from "@/components/ui/FormField";
import { FormSuccessBanner } from "@/components/ui/FormSuccessBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Input, Textarea } from "@/components/ui/Input";

export default function EmailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: SendEmailPayload = { to, subject, body };
    const res = await api.email.send(payload);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || "Failed to send email");
    }
  }

  function handleReset() {
    setSuccess(false);
    setTo("");
    setSubject("");
    setBody("");
  }

  if (success) {
    return (
      <FormSuccessBanner
        title="Email Sent!"
        message={
          <>
            Your email to <strong>{to}</strong> was sent successfully.
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
            Send Email
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Send a transactional email via the Gmail API using OAuth2 credentials
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5"
        >
          <FormField label="To" required>
            <Input type="email" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </FormField>

          <FormField label="Subject" required>
            <Input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Hello from the starter!" />
          </FormField>

          <FormField label="Body" required>
            <Textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email body here…" rows={5} />
          </FormField>

          <ErrorAlert error={error} />

          <SubmitButton loading={loading} label="Send Email" loadingLabel="Sending…" />
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
