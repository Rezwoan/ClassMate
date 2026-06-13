"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { AuthGuard } from "./AuthGuard";
import { BottomNav } from "./BottomNav";
import { UserIcon } from "@/components/ui/icons";

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <AuthGuard requireSemester>
      <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
        <header className="sticky top-0 z-30 bg-bg/90 px-4 pt-4 pb-3 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {action}
              <Link
                href="/settings"
                aria-label="Profile & settings"
                className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary"
              >
                {user ? (
                  <span className="text-sm font-bold">
                    {user.fullName.slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <UserIcon className="size-5" />
                )}
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-1">{children}</main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
