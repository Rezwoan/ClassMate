"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import type { AdminUserList } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button, Card, EmptyState, Input, PageLoader } from "@/components/ui/primitives";
import { ChevronRightIcon, SearchIcon, ShieldIcon } from "@/components/ui/icons";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box; reset to page 1 on a new term.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(debounced ? { search: debounced } : {}),
  }).toString();
  const { data, loading, error } = useApi<AdminUserList>(`/admin/users?${query}`);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminShell title="Users" subtitle={data ? `${data.total} total` : "Manage accounts"}>
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, student ID…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : error || !data ? (
        <EmptyState icon="😕" title="Couldn't load users" subtitle={error ?? ""} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="🔍" title="No users found" subtitle="Try a different search." />
      ) : (
        <>
          <div className="grid gap-2">
            {data.items.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`}>
                <Card className="flex items-center gap-3 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {u.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-bold text-ink">
                      {u.fullName}
                      {u.isAdmin && <ShieldIcon className="size-3.5 text-primary" />}
                    </p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted">
                      <span>{u._count.courses} courses</span>
                      <span>{u._count.notes} notes</span>
                      <span
                        className={u.emailVerified ? "text-primary" : "text-accent"}
                      >
                        {u.emailVerified ? "Verified" : "Unverified"}
                      </span>
                      <span>{formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRightIcon className="size-5 shrink-0 text-muted" />
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="soft"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="soft"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
