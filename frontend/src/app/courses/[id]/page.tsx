"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { ClassSession, Course, Note, Teacher } from "@/lib/types";
import { cn, formatDate, formatTime, WEEKDAYS_LONG } from "@/lib/utils";
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
import {
  ClockIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@/components/ui/icons";

type CourseDetail = Course & {
  classSessions: ClassSession[];
  teachers: Teacher[];
};

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

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const course = useApi<CourseDetail>(`/courses/${id}`);
  const notes = useApi<Note[]>(`/notes?courseId=${id}`);

  type SheetKind =
    | null
    | { kind: "course" }
    | { kind: "session" }
    | { kind: "teacher"; editing?: Teacher }
    | { kind: "note"; editing?: Note };
  const [sheet, setSheet] = useState<SheetKind>(null);
  const close = () => setSheet(null);

  const data = course.data;

  async function deleteCourse() {
    try {
      await api(`/courses/${id}`, { method: "DELETE" });
      toast("Course deleted", "info");
      router.replace("/courses");
    } catch {
      toast("Could not delete course", "error");
    }
  }

  async function deleteEntity(path: string, reloadFn: () => void) {
    try {
      await api(path, { method: "DELETE" });
      reloadFn();
    } catch {
      toast("Could not delete", "error");
    }
  }

  if (course.loading) {
    return (
      <AppShell title="Course">
        <PageLoader />
      </AppShell>
    );
  }
  if (course.error || !data) {
    return (
      <AppShell title="Course">
        <EmptyState icon="😕" title="Course not found" subtitle={course.error ?? ""} />
      </AppShell>
    );
  }

  return (
    <AppShell title={data.name} subtitle={data.code ?? "Course"}>
      {/* Header */}
      <Card className="mb-5 flex items-center gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-ink"
          style={{ background: data.color }}
        >
          {(data.code || data.name).slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-ink">{data.name}</p>
          <p className="text-xs text-muted">
            {[data.code, data.credits ? `${data.credits} credits` : null]
              .filter(Boolean)
              .join(" · ") || "Course"}
          </p>
        </div>
        <button
          onClick={() => setSheet({ kind: "course" })}
          aria-label="Edit course"
          className="grid size-9 place-items-center rounded-full bg-surface-muted text-ink"
        >
          <PencilIcon className="size-4" />
        </button>
      </Card>

      {/* Schedule */}
      <SectionHeader
        title="Class schedule"
        onAdd={() => setSheet({ kind: "session" })}
      />
      {data.classSessions.length > 0 ? (
        <Card className="mb-5 space-y-2 p-2">
          {data.classSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-field bg-surface p-3">
              <span className="w-1.5 self-stretch rounded-full" style={{ background: data.color }} />
              <div className="flex-1">
                <p className="font-semibold text-ink">
                  {WEEKDAYS_LONG[s.dayOfWeek]}
                  {s.label ? ` · ${s.label}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </span>
                  {s.room && (
                    <span className="inline-flex items-center gap-1">
                      <PinIcon className="size-3.5" /> {s.room}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteEntity(`/class-sessions/${s.id}`, course.reload)}
                aria-label="Delete class"
                className="text-muted hover:text-danger"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          ))}
        </Card>
      ) : (
        <p className="mb-5 px-1 text-sm text-muted">No weekly classes added yet.</p>
      )}

      {/* Teachers */}
      <SectionHeader title="Teachers" onAdd={() => setSheet({ kind: "teacher" })} />
      {data.teachers.length > 0 ? (
        <div className="mb-5 grid gap-3">
          {data.teachers.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <UserIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{t.name}</p>
                  <div className="mt-1 space-y-1 text-sm">
                    {t.email && (
                      <a
                        href={`mailto:${t.email}`}
                        className="flex items-center gap-2 text-primary"
                      >
                        <MailIcon className="size-4" /> {t.email}
                      </a>
                    )}
                    {t.phone && (
                      <a href={`tel:${t.phone}`} className="flex items-center gap-2 text-primary">
                        <PhoneIcon className="size-4" /> {t.phone}
                      </a>
                    )}
                    {(t.officeRoom || t.officeHours) && (
                      <p className="flex items-center gap-2 text-muted">
                        <PinIcon className="size-4" />
                        {[t.officeRoom, t.officeHours].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setSheet({ kind: "teacher", editing: t })}
                    aria-label="Edit teacher"
                    className="text-muted hover:text-ink"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => deleteEntity(`/teachers/${t.id}`, course.reload)}
                    aria-label="Delete teacher"
                    className="text-muted hover:text-danger"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mb-5 px-1 text-sm text-muted">No teacher details yet.</p>
      )}

      {/* Notes */}
      <SectionHeader title="Notes" onAdd={() => setSheet({ kind: "note" })} />
      {notes.data && notes.data.length > 0 ? (
        <div className="grid gap-3">
          {notes.data.map((n) => (
            <button
              key={n.id}
              onClick={() => setSheet({ kind: "note", editing: n })}
              className="text-left"
            >
              <Card>
                <p className="font-bold text-ink">{n.title}</p>
                <p className="text-xs text-muted">{formatDate(n.updatedAt)}</p>
                {n.content && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-ink/80">
                    {n.content}
                  </p>
                )}
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-1 text-sm text-muted">No notes for this course yet.</p>
      )}

      {/* Sheets */}
      {sheet?.kind === "course" && (
        <CourseFormSheet
          course={data}
          palette={PALETTE}
          onClose={close}
          onSaved={() => {
            close();
            course.reload();
          }}
          onDelete={deleteCourse}
        />
      )}
      {sheet?.kind === "session" && (
        <SessionFormSheet
          courseId={id}
          onClose={close}
          onSaved={() => {
            close();
            course.reload();
          }}
        />
      )}
      {sheet?.kind === "teacher" && (
        <TeacherFormSheet
          courseId={id}
          editing={sheet.editing}
          onClose={close}
          onSaved={() => {
            close();
            course.reload();
          }}
        />
      )}
      {sheet?.kind === "note" && (
        <NoteFormSheet
          courseId={id}
          sessions={data.classSessions}
          editing={sheet.editing}
          onClose={close}
          onSaved={() => {
            close();
            notes.reload();
          }}
        />
      )}
    </AppShell>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h3 className="text-sm font-bold text-muted">{title}</h3>
      <button onClick={onAdd} className="flex items-center gap-1 text-sm font-semibold text-primary">
        <PlusIcon className="size-4" /> Add
      </button>
    </div>
  );
}

function useSaver() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const run = async (fn: () => Promise<void>, okMsg: string) => {
    setSaving(true);
    try {
      await fn();
      toast(okMsg, "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  };
  return { saving, run };
}

function CourseFormSheet({
  course,
  palette,
  onClose,
  onSaved,
  onDelete,
}: {
  course: Course;
  palette: string[];
  onClose: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const { saving, run } = useSaver();
  const [form, setForm] = useState({
    name: course.name,
    code: course.code ?? "",
    color: course.color,
    credits: course.credits?.toString() ?? "",
  });
  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit course"
      footer={
        <div className="flex justify-end">
          <ConfirmButton onConfirm={onDelete}>Delete course</ConfirmButton>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              api(`/courses/${course.id}`, {
                method: "PATCH",
                body: {
                  name: form.name,
                  code: form.code || undefined,
                  color: form.color,
                  credits: form.credits ? Number(form.credits) : undefined,
                },
              }).then(() => undefined),
            "Course updated",
          ).then(onSaved);
        }}
        className="space-y-4"
      >
        <Field label="Course name">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code">
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </Field>
          <Field label="Credits">
            <Input
              type="number"
              step="0.5"
              value={form.credits}
              onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
            />
          </Field>
        </div>
        <div>
          <p className="label">Color</p>
          <div className="flex flex-wrap gap-2">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn(
                  "size-9 rounded-full border-2 transition",
                  form.color === c ? "scale-110 border-ink" : "border-transparent",
                )}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <Button type="submit" loading={saving} className="w-full">
          Save changes
        </Button>
      </form>
    </Sheet>
  );
}

function SessionFormSheet({
  courseId,
  onClose,
  onSaved,
}: {
  courseId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { saving, run } = useSaver();
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:30",
    room: "",
    label: "",
  });
  return (
    <Sheet open onClose={onClose} title="Add class">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              api("/class-sessions", {
                method: "POST",
                body: {
                  courseId,
                  dayOfWeek: Number(form.dayOfWeek),
                  startTime: form.startTime,
                  endTime: form.endTime,
                  room: form.room || undefined,
                  label: form.label || undefined,
                },
              }).then(() => undefined),
            "Class added",
          ).then(onSaved);
        }}
        className="space-y-4"
      >
        <Field label="Day of week">
          <Select
            value={form.dayOfWeek}
            onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
          >
            {WEEKDAYS_LONG.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <Input
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </Field>
          <Field label="End">
            <Input
              type="time"
              required
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Room">
            <Input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="Room 301" />
          </Field>
          <Field label="Label">
            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Lecture / Lab" />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">
          Add class
        </Button>
      </form>
    </Sheet>
  );
}

function TeacherFormSheet({
  courseId,
  editing,
  onClose,
  onSaved,
}: {
  courseId: string;
  editing?: Teacher;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { saving, run } = useSaver();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    officeRoom: editing?.officeRoom ?? "",
    officeHours: editing?.officeHours ?? "",
  });
  return (
    <Sheet open onClose={onClose} title={editing ? "Edit teacher" : "Add teacher"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = {
            name: form.name,
            email: form.email || undefined,
            phone: form.phone || undefined,
            officeRoom: form.officeRoom || undefined,
            officeHours: form.officeHours || undefined,
          };
          run(
            () =>
              (editing
                ? api(`/teachers/${editing.id}`, { method: "PATCH", body })
                : api("/teachers", { method: "POST", body: { ...body, courseId } })
              ).then(() => undefined),
            editing ? "Teacher updated" : "Teacher added",
          ).then(onSaved);
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. Smith" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="smith@university.edu" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555 0100" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Office room">
            <Input value={form.officeRoom} onChange={(e) => setForm((f) => ({ ...f, officeRoom: e.target.value }))} placeholder="B-12" />
          </Field>
          <Field label="Office hours">
            <Input value={form.officeHours} onChange={(e) => setForm((f) => ({ ...f, officeHours: e.target.value }))} placeholder="Mon 2-4pm" />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">
          {editing ? "Save changes" : "Add teacher"}
        </Button>
      </form>
    </Sheet>
  );
}

function NoteFormSheet({
  courseId,
  sessions,
  editing,
  onClose,
  onSaved,
}: {
  courseId: string;
  sessions: ClassSession[];
  editing?: Note;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { saving, run } = useSaver();
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    content: editing?.content ?? "",
    classSessionId: editing?.classSessionId ?? "",
  });

  async function del() {
    if (!editing) return;
    try {
      await api(`/notes/${editing.id}`, { method: "DELETE" });
      toast("Note deleted", "info");
      onSaved();
    } catch {
      toast("Could not delete", "error");
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={editing ? "Edit note" : "New note"}
      footer={
        editing ? (
          <div className="flex justify-end">
            <ConfirmButton onConfirm={del}>Delete note</ConfirmButton>
          </div>
        ) : undefined
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = {
            title: form.title,
            content: form.content,
            classSessionId: form.classSessionId || undefined,
          };
          run(
            () =>
              (editing
                ? api(`/notes/${editing.id}`, {
                    method: "PATCH",
                    body: { title: form.title, content: form.content },
                  })
                : api("/notes", { method: "POST", body: { ...body, courseId } })
              ).then(() => undefined),
            editing ? "Note updated" : "Note saved",
          ).then(onSaved);
        }}
        className="space-y-4"
      >
        <Field label="Title">
          <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lecture 3 — recursion" />
        </Field>
        {!editing && sessions.length > 0 && (
          <Field label="Link to a class (optional)">
            <Select
              value={form.classSessionId}
              onChange={(e) => setForm((f) => ({ ...f, classSessionId: e.target.value }))}
            >
              <option value="">No specific class</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {WEEKDAYS_LONG[s.dayOfWeek]} {formatTime(s.startTime)}
                  {s.label ? ` · ${s.label}` : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
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
  );
}
