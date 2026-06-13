"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Course } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageLoader,
} from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";

const PALETTE = [
  "#A7C7FF",
  "#FFD3A5",
  "#B5EAD7",
  "#FFB5C2",
  "#D7BDFF",
  "#FDE68A",
  "#9DECF9",
  "#C3F584",
];

export default function CoursesPage() {
  const { data, loading, error, reload } = useApi<Course[]>("/courses");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", color: PALETTE[0], credits: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/courses", {
        method: "POST",
        body: {
          name: form.name,
          code: form.code || undefined,
          color: form.color,
          credits: form.credits ? Number(form.credits) : undefined,
        },
      });
      toast("Course added 📘", "success");
      setOpen(false);
      setForm({ name: "", code: "", color: PALETTE[0], credits: "" });
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add course", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Courses"
      subtitle="Your subjects this semester"
      action={
        <Button onClick={() => setOpen(true)} className="px-3 py-2">
          <PlusIcon className="size-4" /> Add
        </Button>
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon="😕" title="Couldn't load courses" subtitle={error} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="flex items-center gap-3">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-2xl text-base font-extrabold text-ink"
                  style={{ background: c.color }}
                >
                  {(c.code || c.name).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-muted">
                    {[c.code, c.credits ? `${c.credits} cr` : null]
                      .filter(Boolean)
                      .join(" · ") || "Course"}
                  </p>
                  {c._count && (
                    <div className="mt-1 flex gap-3 text-[11px] text-muted">
                      <span>{c._count.classSessions} classes</span>
                      <span>{c._count.quizzes} quizzes</span>
                      <span>{c._count.homework} tasks</span>
                    </div>
                  )}
                </div>
                <ChevronRightIcon className="size-5 text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📚"
          title="No courses yet"
          subtitle="Add your first course to start building your schedule."
          action={<Button onClick={() => setOpen(true)}>Add a course</Button>}
        />
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Add course">
        <form onSubmit={create} className="space-y-4">
          <Field label="Course name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Data Structures"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code">
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="CSE-220"
              />
            </Field>
            <Field label="Credits">
              <Input
                type="number"
                step="0.5"
                min="0"
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                placeholder="3"
              />
            </Field>
          </div>
          <div>
            <p className="label">Color</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`size-9 rounded-full border-2 transition ${
                    form.color === c ? "border-ink scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <Button type="submit" loading={saving} className="w-full">
            Add course
          </Button>
        </form>
      </Sheet>
    </AppShell>
  );
}
