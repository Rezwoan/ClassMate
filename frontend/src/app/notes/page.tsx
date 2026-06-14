"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import type { Course, Note } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, EmptyState, PageLoader } from "@/components/ui/primitives";
import { NoteSheet, NoteThumbs, noteTitle } from "@/components/notes/NoteSheet";
import { PlusIcon } from "@/components/ui/icons";

export default function NotesPage() {
  const { data, loading, error, reload } = useApi<Note[]>("/notes");
  const { data: courses } = useApi<Course[]>("/courses");
  const [sheet, setSheet] = useState<{ editing?: Note } | null>(null);

  const hasCourses = Boolean(courses && courses.length > 0);

  return (
    <AppShell
      title="Notes"
      subtitle="Everything you jot down"
      action={
        hasCourses ? (
          <Button onClick={() => setSheet({})} className="px-3 py-2">
            <PlusIcon className="size-4" /> Add
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon="😕" title="Couldn't load notes" subtitle={error} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((n) => (
            <button key={n.id} onClick={() => setSheet({ editing: n })} className="text-left">
              <Card>
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
                    style={{ background: n.course?.color ?? "#A7C7FF" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{noteTitle(n)}</p>
                    <p className="text-xs text-muted">
                      {n.course?.code || n.course?.name} · {formatDate(n.updatedAt)}
                    </p>
                    {n.content && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink/80 whitespace-pre-wrap">
                        {n.content}
                      </p>
                    )}
                    <NoteThumbs images={n.images} />
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
            hasCourses ? (
              <Button onClick={() => setSheet({})}>Add a note</Button>
            ) : (
              <p className="text-sm text-muted">Add a course first.</p>
            )
          }
        />
      )}

      {sheet && (
        <NoteSheet
          open
          courses={courses ?? []}
          editing={sheet.editing}
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null);
            reload();
          }}
        />
      )}
    </AppShell>
  );
}
