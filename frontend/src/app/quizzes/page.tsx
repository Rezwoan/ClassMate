"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Course, Quiz } from "@/lib/types";
import { formatDateTime, relativeDays, toDateTimeInput } from "@/lib/utils";
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

const empty = { courseId: "", title: "", date: "", topics: "" };

export default function QuizzesPage() {
  const { data, loading, error, reload } = useApi<Quiz[]>("/quizzes");
  const { data: courses } = useApi<Course[]>("/courses");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, courseId: courses?.[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(q: Quiz) {
    setEditing(q);
    setForm({
      courseId: q.courseId,
      title: q.title,
      date: toDateTimeInput(q.date),
      topics: q.topics ?? "",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title,
        date: new Date(form.date).toISOString(),
        topics: form.topics || undefined,
      };
      if (editing) {
        await api(`/quizzes/${editing.id}`, { method: "PATCH", body });
      } else {
        await api("/quizzes", { method: "POST", body: { ...body, courseId: form.courseId } });
      }
      toast(editing ? "Quiz updated" : "Quiz added 📝", "success");
      setOpen(false);
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/quizzes/${id}`, { method: "DELETE" });
      toast("Quiz deleted", "info");
      reload();
    } catch {
      toast("Could not delete", "error");
    }
  }

  const now = Date.now();
  const upcoming = (data ?? []).filter((q) => new Date(q.date).getTime() >= now);
  const past = (data ?? []).filter((q) => new Date(q.date).getTime() < now);

  return (
    <AppShell
      title="Quizzes"
      subtitle="Dates & topics to study"
      action={
        <Button onClick={openAdd} className="px-3 py-2">
          <PlusIcon className="size-4" /> Add
        </Button>
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon="😕" title="Couldn't load quizzes" subtitle={error} />
      ) : data && data.length > 0 ? (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h3 className="px-1 text-sm font-bold text-muted">Upcoming</h3>
              {upcoming.map((q) => (
                <QuizCard key={q.id} q={q} onEdit={openEdit} onDelete={remove} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h3 className="px-1 text-sm font-bold text-muted">Past</h3>
              {past.map((q) => (
                <QuizCard key={q.id} q={q} onEdit={openEdit} onDelete={remove} faded />
              ))}
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          icon="📝"
          title="No quizzes yet"
          subtitle="Add a quiz with its date and topics — we'll remind you to study."
          action={
            courses && courses.length > 0 ? (
              <Button onClick={openAdd}>Add a quiz</Button>
            ) : (
              <p className="text-sm text-muted">Add a course first.</p>
            )
          }
        />
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit quiz" : "Add quiz"}>
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
              placeholder="Quiz 1: Trees"
            />
          </Field>
          <Field label="Date & time">
            <Input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="Topics / syllabus">
            <Textarea
              value={form.topics}
              onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
              placeholder="BST, AVL trees, traversals…"
            />
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            {editing ? "Save changes" : "Add quiz"}
          </Button>
        </form>
      </Sheet>
    </AppShell>
  );
}

function QuizCard({
  q,
  onEdit,
  onDelete,
  faded,
}: {
  q: Quiz;
  onEdit: (q: Quiz) => void;
  onDelete: (id: string) => void;
  faded?: boolean;
}) {
  return (
    <Card className={faded ? "opacity-70" : ""}>
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
          style={{ background: q.course?.color ?? "#A7C7FF" }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{q.title}</p>
          <p className="text-xs text-muted">
            {q.course?.code || q.course?.name} · {formatDateTime(q.date)}
          </p>
          {q.topics && <p className="mt-2 text-sm text-ink/80">{q.topics}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="chip bg-primary-soft text-primary">{relativeDays(q.date)}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(q)} aria-label="Edit" className="text-muted hover:text-ink">
              <PencilIcon className="size-4" />
            </button>
            <ConfirmButton onConfirm={() => onDelete(q.id)}>Del</ConfirmButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
