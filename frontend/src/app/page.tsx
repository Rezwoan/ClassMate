"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";
import type { AgendaResponse, AgendaSessionView } from "@/lib/types";
import { cn, formatDate, formatTime, relativeDays, WEEKDAYS } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Card, EmptyState, PageLoader } from "@/components/ui/primitives";
import {
  BellIcon,
  ClipboardIcon,
  ClockIcon,
  PinIcon,
  TaskIcon,
} from "@/components/ui/icons";

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}

function ClassRow({ s }: { s: AgendaSessionView }) {
  return (
    <div className="flex items-stretch gap-3 rounded-field bg-surface p-3">
      <span className="w-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
      <div className="w-16 shrink-0">
        <p className="text-sm font-bold text-ink">{formatTime(s.startTime)}</p>
        <p className="text-xs text-muted">{formatTime(s.endTime)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{s.courseName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {s.courseCode && <span>{s.courseCode}</span>}
          {s.classNumber ? <span>Class {s.classNumber}</span> : null}
          {s.room && (
            <span className="inline-flex items-center gap-1">
              <PinIcon className="size-3.5" /> {s.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  const { data, loading, error } = useApi<AgendaResponse>("/agenda");
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDay = useMemo(() => {
    if (!data) return null;
    const target = selected ?? data.today;
    return data.week.find((d) => d.date === target) ?? null;
  }, [data, selected]);

  if (loading) return <PageLoader />;
  if (error || !data)
    return <EmptyState icon="😕" title="Couldn't load your week" subtitle={error ?? ""} />;

  const next = data.nextClass;

  return (
    <div className="space-y-5">
      {/* Next class hero */}
      {next ? (
        <Card className="border-0 bg-linear-to-br from-accent to-[#ff6f3c] text-white">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <ClockIcon className="size-4" /> Next class
          </div>
          <h2 className="mt-1 text-xl font-extrabold">{next.courseName}</h2>
          <p className="mt-0.5 text-sm opacity-90">
            {next.date ? relativeDays(next.date) : "Soon"} · {formatTime(next.startTime)}
            {next.classNumber ? ` · Class ${next.classNumber}` : ""}
            {next.room ? ` · ${next.room}` : ""}
          </p>
        </Card>
      ) : (
        <Card className="bg-primary-soft text-primary">
          <p className="font-semibold">No upcoming classes 🎉</p>
          <p className="text-sm opacity-80">Enjoy the break, or add classes to your courses.</p>
        </Card>
      )}

      {/* Week strip */}
      <section>
        <h3 className="mb-2 px-1 text-sm font-bold text-muted">This week</h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {data.week.map((d) => {
            const isSelected = (selected ?? data.today) === d.date;
            const dayNum = new Date(d.date).getUTCDate();
            return (
              <button
                key={d.date}
                onClick={() => setSelected(d.date)}
                className={cn(
                  "flex w-12 shrink-0 flex-col items-center rounded-2xl border py-2 transition",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : d.isToday
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-line bg-surface text-ink",
                )}
              >
                <span className="text-[11px] font-semibold opacity-80">
                  {WEEKDAYS[d.weekday]}
                </span>
                <span className="text-lg font-extrabold leading-tight">{dayNum}</span>
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full",
                    d.sessions.length
                      ? isSelected
                        ? "bg-white"
                        : "bg-accent"
                      : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected day's classes */}
      <section>
        <h3 className="mb-2 px-1 text-sm font-bold text-muted">
          {selectedDay?.isToday
            ? "Today's classes"
            : selectedDay
              ? formatDate(selectedDay.date)
              : "Classes"}
        </h3>
        {selectedDay && selectedDay.sessions.length > 0 ? (
          <Card className="space-y-2 p-2">
            {selectedDay.sessions.map((s) => (
              <ClassRow key={s.id} s={s} />
            ))}
          </Card>
        ) : (
          <EmptyState icon="🌤️" title="No classes" subtitle="Nothing scheduled for this day." />
        )}
      </section>

      {/* Coming up */}
      <section className="grid gap-3">
        <Link href="/quizzes" className="block">
          <Card className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
              <ClipboardIcon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">Upcoming quizzes</p>
              <p className="text-sm text-muted">
                {data.upcomingQuizzes.length
                  ? `${data.upcomingQuizzes.length} in the next 2 weeks`
                  : "Nothing scheduled"}
              </p>
            </div>
            {data.upcomingQuizzes[0] && (
              <span className="chip bg-primary-soft text-primary">
                {relativeDays(data.upcomingQuizzes[0].date)}
              </span>
            )}
          </Card>
        </Link>
        <Link href="/homework" className="block">
          <Card className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
              <TaskIcon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">Homework due</p>
              <p className="text-sm text-muted">
                {data.dueHomework.length
                  ? `${data.dueHomework.length} pending`
                  : "All caught up 🎉"}
              </p>
            </div>
            {data.dueHomework[0] && (
              <span className="chip bg-accent-soft text-accent">
                {relativeDays(data.dueHomework[0].dueDate)}
              </span>
            )}
          </Card>
        </Link>
      </section>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <AppShell
      title={greeting(user?.fullName)}
      subtitle={today}
      action={
        <Link
          href="/settings"
          aria-label="Notifications"
          className="grid size-10 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-soft)]"
        >
          <BellIcon className="size-5" />
        </Link>
      }
    >
      <HomeContent />
    </AppShell>
  );
}
