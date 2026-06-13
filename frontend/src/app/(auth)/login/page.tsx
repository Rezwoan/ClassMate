"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";
import { getQueryParam } from "@/lib/use-api";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setSession(res);
      const next = getQueryParam("next") || "/";
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast("Verify your email to continue.", "info");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        toast(err instanceof ApiError ? err.message : "Login failed", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Welcome back 👋</h2>
      <p className="mb-5 text-sm text-muted">Log in to see your week at a glance.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
