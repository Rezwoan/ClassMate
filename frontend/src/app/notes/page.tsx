"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Course, Note } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
import { PlusIcon } from "@/components/ui/icons";

const empty = { courseId: "", title: "", content: "" };

export default function NotesPage() {
  const { data, loading, error, reload } = useApi<Note[]>("/notes");
  const { data: courses } = useApi<Course[]>("/courses");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, courseId: courses?.[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(n: Note) {
    setEditing(n);
    setForm({ courseId: n.courseId, title: n.title, content: n.content });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api(`/notes/${editing.id}`, {
          method: "PATCH",
          body: { title: form.title, content: form.content },
        });
      } else {
        await api("/notes", {
          method: "POST",
          body: { courseId: form.courseId, title: form.title, content: form.content },
        });
      }
      toast(editing ? "Note updated" : "Note saved 🗒️", "success");
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
      await api(`/notes/${id}`, { method: "DELETE" });
      toast("Note deleted", "info");
      reload();
    } catch {
      toast("Could not delete", "error");
    }
  }

  return (
    <AppShell
      title="Notes"
      subtitle="Everything you jot down"
      action={
        <Button onClick={openAdd} className="px-3 py-2">
          <PlusIcon className="size-4" /> Add
        </Button>
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon="😕" title="Couldn't load notes" subtitle={error} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((n) => (
            <button key={n.id} onClick={() => openEdit(n)} className="text-left">
              <Card>
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
                    style={{ background: n.course?.color ?? "#A7C7FF" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{n.title}</p>
                    <p className="text-xs text-muted">
                      {n.course?.code || n.course?.name} · {formatDate(n.updatedAt)}
                    </p>
                    {n.content && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink/80 whitespace-pre-wrap">
                        {n.content}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🗒️"
          title="No notes yet"
          subtitle="Capture lecture notes, ideas and reminders per course."
          action={
            courses && courses.length > 0 ? (
              <Button onClick={openAdd}>Add a note</Button>
            ) : (
              <p className="text-sm text-muted">Add a course first.</p>
            )
          }
        />
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit note" : "New note"}
        footer={
          editing ? (
            <div className="flex justify-end">
              <ConfirmButton
                onConfirm={() => {
                  remove(editing.id);
                  setOpen(false);
                }}
              >
                Delete note
              </ConfirmButton>
            </div>
          ) : undefined
        }
      >
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
              placeholder="Lecture 3 — recursion"
            />
          </Field>
          <Field label="Note">
            <Textarea
              className="min-h-40"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write your notes here…"
            />
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            {editing ? "Save changes" : "Save note"}
          </Button>
        </form>
      </Sheet>
    </AppShell>
  );
}
