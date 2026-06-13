"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Course, Homework, HomeworkStatus } from "@/lib/types";
import { cn, formatDateTime, relativeDays, toDateTimeInput } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageLoader,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { ConfirmButton, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { PencilIcon, PlusIcon } from "@/components/ui/icons";

const empty = { courseId: "", title: "", description: "", dueDate: "" };

export default function HomeworkPage() {
  const { data, loading, error, reload } = useApi<Homework[]>("/homework");
  const { data: courses } = useApi<Course[]>("/courses");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, courseId: courses?.[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(h: Homework) {
    setEditing(h);
    setForm({
      courseId: h.courseId,
      title: h.title,
      description: h.description ?? "",
      dueDate: toDateTimeInput(h.dueDate),
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description || undefined,
        dueDate: new Date(form.dueDate).toISOString(),
      };
      if (editing) await api(`/homework/${editing.id}`, { method: "PATCH", body });
      else await api("/homework", { method: "POST", body: { ...body, courseId: form.courseId } });
      toast(editing ? "Homework updated" : "Homework added 📌", "success");
      setOpen(false);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(h: Homework, status: HomeworkStatus) {
    try {
      await api(`/homework/${h.id}`, { method: "PATCH", body: { status } });
      reload();
    } catch {
      toast("Could not update", "error");
    }
  }

  async function remove(id: string) {
    try {
      await api(`/homework/${id}`, { method: "DELETE" });
      toast("Homework deleted", "info");
      reload();
    } catch {
      toast("Could not delete", "error");
    }
  }

  const todo = (data ?? []).filter((h) => h.status !== "submitted");
  const done = (data ?? []).filter((h) => h.status === "submitted");

  return (
    <AppShell
      title="Homework"
      subtitle="Assignments & deadlines"
      action={
        <Button onClick={openAdd} className="px-3 py-2">
          <PlusIcon className="size-4" /> Add
        </Button>
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon="😕" title="Couldn't load homework" subtitle={error} />
      ) : data && data.length > 0 ? (
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-bold text-muted">To do ({todo.length})</h3>
            {todo.length ? (
              todo.map((h) => (
                <HwCard key={h.id} h={h} onToggle={setStatus} onEdit={openEdit} onDelete={remove} />
              ))
            ) : (
              <p className="px-1 text-sm text-muted">Nothing pending. 🎉</p>
            )}
          </section>
          {done.length > 0 && (
            <section className="space-y-3">
              <h3 className="px-1 text-sm font-bold text-muted">Done</h3>
              {done.map((h) => (
                <HwCard key={h.id} h={h} onToggle={setStatus} onEdit={openEdit} onDelete={remove} />
              ))}
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          icon="📌"
          title="No homework yet"
          subtitle="Track assignments and get reminded before they're due."
          action={
            courses && courses.length > 0 ? (
              <Button onClick={openAdd}>Add homework</Button>
            ) : (
              <p className="text-sm text-muted">Add a course first.</p>
            )
          }
        />
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit homework" : "Add homework"}>
        <form onSubmit={save} className="space-y-4">
          {!editing && (
            <Field label="Course">
              <Select
                required
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              >
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `${c.code} — ${c.name}` : c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Title">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Assignment 1"
            />
          </Field>
          <Field label="Due date">
            <Input
              type="datetime-local"
              required
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </Field>
          <Field label="Details">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What needs to be done…"
            />
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            {editing ? "Save changes" : "Add homework"}
          </Button>
        </form>
      </Sheet>
    </AppShell>
  );
}

function HwCard({
  h,
  onToggle,
  onEdit,
  onDelete,
}: {
  h: Homework;
  onToggle: (h: Homework, s: HomeworkStatus) => void;
  onEdit: (h: Homework) => void;
  onDelete: (id: string) => void;
}) {
  const submitted = h.status === "submitted";
  const overdue = !submitted && new Date(h.dueDate).getTime() < Date.now();
  return (
    <Card className={cn(submitted && "opacity-70")}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(h, submitted ? "pending" : "submitted")}
          aria-label={submitted ? "Mark as not done" : "Mark as done"}
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
            submitted ? "border-success bg-success text-white" : "border-line text-transparent",
          )}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold text-ink", submitted && "line-through")}>{h.title}</p>
          <p className="text-xs text-muted">
            {h.course?.code || h.course?.name} · {formatDateTime(h.dueDate)}
          </p>
          {h.description && <p className="mt-2 text-sm text-ink/80">{h.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              "chip",
              submitted
                ? "bg-success-soft text-success"
                : overdue
                  ? "bg-danger-soft text-danger"
                  : "bg-accent-soft text-accent",
            )}
          >
            {submitted ? "Done" : overdue ? "Overdue" : relativeDays(h.dueDate)}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(h)} aria-label="Edit" className="text-muted hover:text-ink">
              <PencilIcon className="size-4" />
            </button>
            <ConfirmButton onConfirm={() => onDelete(h.id)}>Del</ConfirmButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
