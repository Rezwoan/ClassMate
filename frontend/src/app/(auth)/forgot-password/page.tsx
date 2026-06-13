"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [phase, setPhase] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", auth: false, body: { email } });
      toast("If that account exists, a reset code was sent.", "info");
      setPhase("reset");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Request failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: { email, code, newPassword },
      });
      toast("Password updated. Please log in.", "success");
      router.replace("/login");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Reset password 🔑</h2>
      {phase === "request" ? (
        <>
          <p className="mb-5 text-sm text-muted">
            Enter your email and we&apos;ll send a reset code.
          </p>
          <form onSubmit={request} className="space-y-4">
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Send reset code
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted">
            Enter the code sent to{" "}
            <span className="font-semibold text-ink">{email}</span> and your new password.
          </p>
          <form onSubmit={reset} className="space-y-4">
            <Field label="Reset code">
              <Input
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="text-center text-xl font-bold tracking-[0.3em]"
              />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <Input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        </>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-primary">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
