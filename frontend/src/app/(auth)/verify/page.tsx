"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";
import { getQueryParam } from "@/lib/use-api";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export default function VerifyPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => setEmail(getQueryParam("email")), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/auth/verify-email", {
        method: "POST",
        auth: false,
        body: { email, code },
      });
      setSession(res);
      toast("Email verified 🎉", "success");
      router.replace("/onboarding");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await api("/auth/resend-otp", { method: "POST", auth: false, body: { email } });
      toast("A new code is on its way.", "info");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not resend", "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Verify your email ✉️</h2>
      <p className="mb-5 text-sm text-muted">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-ink">{email || "your email"}</span>.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        {!email && (
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        )}
        <Field label="Verification code">
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="text-center text-2xl font-bold tracking-[0.4em]"
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Verify & continue
        </Button>
      </form>
      <button
        onClick={resend}
        disabled={resending}
        className="mt-5 block w-full text-center text-sm font-semibold text-primary disabled:opacity-50"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>
    </Card>
  );
}
