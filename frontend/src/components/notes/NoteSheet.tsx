"use client";

import { useEffect, useRef, useState } from "react";
import { api, apiUpload, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/image";
import type { ClassSession, Course, Note } from "@/lib/types";
import { formatDate, formatTime, WEEKDAYS_LONG } from "@/lib/utils";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { AuthImage } from "@/components/ui/AuthImage";
import { ConfirmButton, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { CameraIcon, ImageIcon, TrashIcon } from "@/components/ui/icons";

interface PendingImage {
  key: string;
  blob: Blob;
  filename: string;
  previewUrl: string;
}

export function NoteSheet({
  open,
  onClose,
  onSaved,
  editing,
  courseId,
  courses,
  sessions,
  fixedClassSessionId,
  fixedDate,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Note | null;
  /** Locks the note to a course (course page / home). */
  courseId?: string;
  /** Lets the user pick a course on create (global notes page). */
  courses?: Course[];
  /** Optional class slots a new note can be linked to (course page). */
  sessions?: ClassSession[];
  /** Locks the note to a class slot (home → this day's class). */
  fixedClassSessionId?: string;
  /** Locks the note to a specific class date, "YYYY-MM-DD" (home). */
  fixedDate?: string | null;
}) {
  const { toast } = useToast();
  const isEdit = Boolean(editing);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pickedCourseId, setPickedCourseId] = useState("");
  const [linkSessionId, setLinkSessionId] = useState("");
  const [existing, setExisting] = useState(editing?.images ?? []);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // (Re)initialise whenever the sheet is opened for a different note.
  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setContent(editing?.content ?? "");
    setExisting(editing?.images ?? []);
    setPickedCourseId(courseId ?? courses?.[0]?.id ?? "");
    setLinkSessionId(fixedClassSessionId ?? "");
    setPending([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  // Revoke preview URLs on unmount / when previews change out.
  useEffect(
    () => () => pending.forEach((p) => URL.revokeObjectURL(p.previewUrl)),
    [pending],
  );

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const prepared = await Promise.all(
      Array.from(list).map(async (f) => {
        const { blob, filename } = await compressImage(f);
        return {
          key: `${filename}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          blob,
          filename,
          previewUrl: URL.createObjectURL(blob),
        };
      }),
    );
    setPending((p) => [...p, ...prepared]);
  }

  function removePending(key: string) {
    setPending((p) => {
      const found = p.find((x) => x.key === key);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return p.filter((x) => x.key !== key);
    });
  }

  async function removeExisting(id: string) {
    try {
      await api(`/notes/images/${id}`, { method: "DELETE" });
      setExisting((imgs) => imgs.filter((i) => i.id !== id));
    } catch {
      toast("Could not remove image", "error");
    }
  }

  async function uploadPending(noteId: string) {
    if (!pending.length) return;
    const fd = new FormData();
    pending.forEach((p) => fd.append("images", p.blob, p.filename));
    await apiUpload(`/notes/${noteId}/images`, fd);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const hasContent =
      title.trim() || content.trim() || pending.length || existing.length;
    if (!hasContent) {
      toast("Add a title, some text, or a photo first", "error");
      return;
    }
    const effectiveCourseId = editing?.courseId ?? courseId ?? pickedCourseId;
    if (!effectiveCourseId) {
      toast("Pick a course first", "error");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await api(`/notes/${editing.id}`, {
          method: "PATCH",
          body: { title: title.trim(), content },
        });
        await uploadPending(editing.id);
      } else {
        const note = await api<Note>("/notes", {
          method: "POST",
          body: {
            courseId: effectiveCourseId,
            title: title.trim() || undefined,
            content: content || undefined,
            classSessionId: linkSessionId || undefined,
            date: fixedDate || undefined,
          },
        });
        await uploadPending(note.id);
      }
      toast(isEdit ? "Note updated" : "Note saved 🗒️", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

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

  const lockedSession = fixedClassSessionId
    ? sessions?.find((s) => s.id === fixedClassSessionId)
    : undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit note" : "New note"}
      footer={
        isEdit ? (
          <div className="flex justify-end">
            <ConfirmButton onConfirm={del}>Delete note</ConfirmButton>
          </div>
        ) : undefined
      }
    >
      <form onSubmit={save} className="space-y-4">
        {(fixedDate || lockedSession) && (
          <p className="rounded-field bg-surface-muted px-3 py-2 text-xs font-medium text-muted">
            {lockedSession ? `${WEEKDAYS_LONG[lockedSession.dayOfWeek]} class` : "Class note"}
            {fixedDate ? ` · ${formatDate(fixedDate)}` : ""}
            {lockedSession ? ` · ${formatTime(lockedSession.startTime)}` : ""}
          </p>
        )}

        {!isEdit && !courseId && courses && courses.length > 0 && (
          <Field label="Course">
            <Select
              required
              value={pickedCourseId}
              onChange={(e) => setPickedCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {!isEdit && !fixedClassSessionId && sessions && sessions.length > 0 && (
          <Field label="Link to a class (optional)">
            <Select
              value={linkSessionId}
              onChange={(e) => setLinkSessionId(e.target.value)}
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

        <Field label="Title (optional)">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lecture 3 — recursion"
          />
        </Field>

        <Field label="Note">
          <Textarea
            className="min-h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes here…"
          />
        </Field>

        {/* Images */}
        <div>
          <p className="label">Photos</p>
          {(existing.length > 0 || pending.length > 0) && (
            <div className="mb-3 grid grid-cols-3 gap-2">
              {existing.map((img) => (
                <div key={img.id} className="relative aspect-square">
                  <AuthImage
                    imageId={img.id}
                    className="size-full rounded-field"
                  />
                  <ImageDeleteButton onClick={() => removeExisting(img.id)} />
                </div>
              ))}
              {pending.map((p) => (
                <div key={p.key} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                  <img
                    src={p.previewUrl}
                    alt="New photo"
                    className="size-full rounded-field object-cover"
                  />
                  <ImageDeleteButton onClick={() => removePending(p.key)} />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="soft"
              onClick={() => cameraRef.current?.click()}
            >
              <CameraIcon className="size-4" /> Camera
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={() => galleryRef.current?.click()}
            >
              <ImageIcon className="size-4" /> Gallery
            </Button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <Button type="submit" loading={busy} className="w-full">
          {isEdit ? "Save changes" : "Save note"}
        </Button>
      </form>
    </Sheet>
  );
}

/** Display title for a note that may be image-only (empty title). */
export function noteTitle(n: Note): string {
  if (n.title.trim()) return n.title;
  if (n.images && n.images.length > 0) return "Photo note";
  return "Untitled note";
}

function ImageDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove photo"
      className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/60 text-white"
    >
      <TrashIcon className="size-3.5" />
    </button>
  );
}

/** A small inline thumbnail strip for note cards. */
export function NoteThumbs({
  images,
  max = 4,
}: {
  images: Note["images"];
  max?: number;
}) {
  if (!images || images.length === 0) return null;
  const shown = images.slice(0, max);
  const extra = images.length - shown.length;
  return (
    <div className="mt-2 flex gap-1.5">
      {shown.map((img) => (
        <AuthImage
          key={img.id}
          imageId={img.id}
          className="size-12 rounded-lg"
        />
      ))}
      {extra > 0 && (
        <span className="grid size-12 place-items-center rounded-lg bg-surface-muted text-xs font-semibold text-muted">
          +{extra}
        </span>
      )}
    </div>
  );
}
