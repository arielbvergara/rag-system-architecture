"use client";

import { useState, FormEvent } from "react";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { SubmitButton } from "./SubmitButton";
import { ErrorAlert } from "./ErrorAlert";
import api from "@/lib/api";

interface AdminAuthProps {
  onAuthenticated: (token: string) => void;
}

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.admin.authenticate(password);
      if (result.success && result.data?.token) {
        sessionStorage.setItem("adminToken", result.data.token);
        onAuthenticated(result.data.token);
      } else {
        setError(result.error ?? "Authentication failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Admin Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Password" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </FormField>
          <ErrorAlert error={error} />
          <SubmitButton loading={loading} label="Sign in" loadingLabel="Signing in…" />
        </form>
      </div>
    </div>
  );
}
