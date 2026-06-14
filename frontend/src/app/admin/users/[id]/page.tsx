"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";
import type { AdminUserDetail } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  Button,
  Card,
  EmptyState,
  PageLoader,
  Switch,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { ShieldIcon } from "@/components/ui/icons";

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-field bg-surface-muted px-3 py-2 text-center">
      <p className="text-lg font-extrabold text-ink">{value}</p>
      <p className="text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, reload } = useApi<AdminUserDetail>(`/admin/users/${id}`);
  const [busy, setBusy] = useState(false);

  const isSelf = me?.id === id;

  async function patch(partial: { emailVerified?: boolean; isAdmin?: boolean }) {
    setBusy(true);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: partial });
      toast("Saved", "success");
      reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this user and ALL their data? This cannot be undone.")) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      toast("User deleted", "info");
      router.replace("/admin/users");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete", "error");
    }
  }

  return (
    <AdminShell title="User" subtitle={data?.email}>
      {loading ? (
        <PageLoader />
      ) : error || !data ? (
        <EmptyState icon="😕" title="User not found" subtitle={error ?? ""} />
      ) : (
        <div className="space-y-5">
          <Card className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">
              {data.fullName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-lg font-bold text-ink">
                {data.fullName}
                {data.isAdmin && <ShieldIcon className="size-4 text-primary" />}
              </p>
              <p className="truncate text-sm text-muted">{data.email}</p>
              <p className="text-xs text-muted">
                {data.instituteName} · ID {data.studentId}
                {data.department ? ` · ${data.department}` : ""}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-2">
            <CountPill label="Semesters" value={data._count.semesters} />
            <CountPill label="Courses" value={data._count.courses} />
            <CountPill label="Notes" value={data._count.notes} />
            <CountPill label="Quizzes" value={data._count.quizzes} />
            <CountPill label="Homework" value={data._count.homework} />
            <CountPill label="Classes" value={data._count.classSessions} />
            <CountPill label="Teachers" value={data._count.teachers} />
            <CountPill label="Push" value={data._count.pushSubscriptions} />
          </div>

          <div>
            <h3 className="mb-2 px-1 text-sm font-bold text-muted">Access</h3>
            <Card className="divide-y divide-line">
              <Row title="Email verified" desc="Allows login.">
                <Switch
                  checked={data.emailVerified}
                  disabled={busy}
                  onChange={(v) => patch({ emailVerified: v })}
                />
              </Row>
              <Row
                title="Administrator"
                desc={isSelf ? "You can't change your own admin access." : "Full admin panel access."}
              >
                <Switch
                  checked={data.isAdmin}
                  disabled={busy || isSelf}
                  onChange={(v) => patch({ isAdmin: v })}
                />
              </Row>
            </Card>
          </div>

          {data.semesters.length > 0 && (
            <div>
              <h3 className="mb-2 px-1 text-sm font-bold text-muted">Semesters</h3>
              <Card className="divide-y divide-line p-0">
                {data.semesters.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {s.name}
                        {s.isActive && (
                          <span className="ml-2 chip bg-primary-soft text-primary">Active</span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(s.startDate)} – {formatDate(s.endDate)}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{s._count.courses} courses</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {data.courses.length > 0 && (
            <div>
              <h3 className="mb-2 px-1 text-sm font-bold text-muted">Courses</h3>
              <div className="flex flex-wrap gap-2">
                {data.courses.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm text-ink"
                  >
                    <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                    {c.code || c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="px-1 text-xs text-muted">
            Joined {formatDateTime(data.createdAt)}
          </p>

          <div>
            <h3 className="mb-2 px-1 text-sm font-bold text-danger">Danger zone</h3>
            <Card>
              <Row
                title="Delete user"
                desc={isSelf ? "You can't delete your own account here." : "Removes the account and all their data."}
              >
                <Button variant="danger" disabled={isSelf} onClick={remove} className="px-4 py-2">
                  Delete
                </Button>
              </Row>
            </Card>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
