"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import type { AgendaSessionView, ClassSession, Note } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { Card, EmptyState, Spinner } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { NoteSheet, NoteThumbs, noteTitle } from "./NoteSheet";
import {
  CameraIcon,
  ClockIcon,
  NoteIcon,
  PinIcon,
} from "@/components/ui/icons";

/**
 * Opened from the home screen when a class is tapped. Shows the notes for that
 * specific class on that specific date, and lets the user jot a note or snap a
 * photo of their hand-written notes for it.
 */
export function ClassDaySheet({
  session,
  date,
  onClose,
}: {
  session: AgendaSessionView;
  date: string;
  onClose: () => void;
}) {
  const notes = useApi<Note[]>(
    `/notes?classSessionId=${session.id}&date=${date}`,
  );
  const [noteSheet, setNoteSheet] = useState<{ editing?: Note } | null>(null);

  // Minimal ClassSession so NoteSheet can show the locked class context.
  const sessionForLink: ClassSession = {
    id: session.id,
    courseId: session.courseId,
    dayOfWeek: session.dayOfWeek,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    label: session.label,
  };

  return (
    <Sheet open onClose={onClose} title={session.courseName}>
      <div className="space-y-4">
        <div className="rounded-field bg-surface-muted p-3">
          <p className="text-sm font-semibold text-ink">{formatDate(date)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </span>
            {session.room && (
              <span className="inline-flex items-center gap-1">
                <PinIcon className="size-3.5" /> {session.room}
              </span>
            )}
            {session.classNumber ? <span>Class {session.classNumber}</span> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setNoteSheet({})}
            className="flex flex-col items-center gap-1 rounded-field bg-primary-soft px-3 py-4 text-primary"
          >
            <NoteIcon className="size-6" />
            <span className="text-sm font-semibold">Write a note</span>
          </button>
          <button
            onClick={() => setNoteSheet({})}
            className="flex flex-col items-center gap-1 rounded-field bg-accent-soft px-3 py-4 text-accent"
          >
            <CameraIcon className="size-6" />
            <span className="text-sm font-semibold">Add a photo</span>
          </button>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-muted">Notes for this class</h3>
          {notes.loading ? (
            <div className="flex justify-center py-6 text-primary">
              <Spinner className="size-6" />
            </div>
          ) : notes.data && notes.data.length > 0 ? (
            <div className="grid gap-2">
              {notes.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNoteSheet({ editing: n })}
                  className="text-left"
                >
                  <Card className="p-3">
                    <p className="font-semibold text-ink">{noteTitle(n)}</p>
                    {n.content && (
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-ink/80">
                        {n.content}
                      </p>
                    )}
                    <NoteThumbs images={n.images} />
                  </Card>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📝"
              title="No notes yet"
              subtitle="Add a note or snap a photo of your class notes."
            />
          )}
        </div>
      </div>

      {noteSheet && (
        <NoteSheet
          open
          courseId={session.courseId}
          sessions={[sessionForLink]}
          fixedClassSessionId={session.id}
          fixedDate={date}
          editing={noteSheet.editing}
          onClose={() => setNoteSheet(null)}
          onSaved={() => {
            setNoteSheet(null);
            notes.reload();
          }}
        />
      )}
    </Sheet>
  );
}
