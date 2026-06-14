"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import type { AdminStats } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, EmptyState, PageLoader } from "@/components/ui/primitives";
import { ShieldIcon } from "@/components/ui/icons";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-xs font-semibold text-muted">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 px-1 text-sm font-bold text-muted">{title}</h3>
      {children}
    </section>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi<AdminStats>("/admin/stats");

  return (
    <AdminShell title="Dashboard" subtitle="System overview">
      {loading ? (
        <PageLoader />
      ) : error || !data ? (
        <EmptyState icon="😕" title="Couldn't load stats" subtitle={error ?? ""} />
      ) : (
        <>
          <Section title="Users">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total users" value={data.users.total} />
              <Stat label="Verified" value={data.users.verified} />
              <Stat label="Admins" value={data.users.admins} />
              <Stat label="New (7 days)" value={data.users.newLast7Days} />
            </div>
          </Section>

          <Section title="Content">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Semesters" value={data.content.semesters} />
              <Stat label="Courses" value={data.content.courses} />
              <Stat label="Class slots" value={data.content.classSessions} />
              <Stat label="Teachers" value={data.content.teachers} />
              <Stat label="Notes" value={data.content.notes} />
              <Stat label="Note images" value={data.content.noteImages} />
              <Stat label="Quizzes" value={data.content.quizzes} />
              <Stat label="Homework" value={data.content.homework} />
            </div>
          </Section>

          <Section title="System">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Image storage"
                value={formatBytes(data.storage.imageBytes)}
                hint="in the database"
              />
              <Stat label="Push subscriptions" value={data.push.subscriptions} />
            </div>
          </Section>

          <Section title="Newest users">
            <Card className="divide-y divide-line p-0">
              {data.recentUsers.length === 0 ? (
                <p className="p-4 text-sm text-muted">No users yet.</p>
              ) : (
                data.recentUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 p-3 transition hover:bg-surface-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
                        {u.fullName}
                        {u.isAdmin && <ShieldIcon className="size-3.5 text-primary" />}
                      </p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted">
                      <p>{formatDate(u.createdAt)}</p>
                      <p className={u.emailVerified ? "text-primary" : "text-accent"}>
                        {u.emailVerified ? "Verified" : "Unverified"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </Section>
        </>
      )}
    </AdminShell>
  );
}
