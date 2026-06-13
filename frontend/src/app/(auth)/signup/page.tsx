"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    instituteName: "",
    studentId: "",
    department: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/signup", {
        method: "POST",
        auth: false,
        body: {
          ...form,
          department: form.department || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      toast("Account created! Check your email for a code.", "success");
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Create your account</h2>
      <p className="mb-5 text-sm text-muted">It takes less than a minute.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input required value={form.fullName} onChange={set("fullName")} placeholder="Jane Doe" />
        </Field>
        <Field label="Institute / University">
          <Input
            required
            value={form.instituteName}
            onChange={set("instituteName")}
            placeholder="State University"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Student ID">
            <Input required value={form.studentId} onChange={set("studentId")} placeholder="CSE-21-001" />
          </Field>
          <Field label="Department">
            <Input value={form.department} onChange={set("department")} placeholder="CSE" />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@university.edu"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </Card>
  );
}
