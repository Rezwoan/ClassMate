"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

function OnboardingInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/semesters", {
        method: "POST",
        body: {
          name,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      toast("You're all set! 🎓", "success");
      router.replace("/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/icon.svg" alt="ClassMate" width={56} height={56} className="mb-3 rounded-2xl" />
        <h1 className="text-2xl font-extrabold tracking-tight">
          Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Let&apos;s set up your semester. You can change this anytime in settings.
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Semester name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2026"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Ends">
              <Input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Start using ClassMate
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingInner />
    </AuthGuard>
  );
}
