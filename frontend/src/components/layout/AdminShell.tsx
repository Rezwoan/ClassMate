"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/primitives";
import { AuthGuard } from "./AuthGuard";
import {
  ChartIcon,
  ChevronLeftIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/ui/icons";

const TABS = [
  { href: "/admin", label: "Dashboard", Icon: ChartIcon, exact: true },
  { href: "/admin/users", label: "Users", Icon: UsersIcon, exact: false },
];

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed" && user && !user.isAdmin) router.replace("/");
  }, [status, user, router]);

  if (status !== "authed" || !user || !user.isAdmin) return <PageLoader />;
  return <>{children}</>;
}

export function AdminShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <AdminGate>
        <div className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-bg/90 px-4 pt-4 pb-3 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
              >
                <ChevronLeftIcon className="size-4" /> Back to app
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                <ShieldIcon className="size-3.5" /> Admin
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
                {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
              </div>
              {action}
            </div>
            <nav className="mt-3 flex gap-2">
              {TABS.map(({ href, label, Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                      active
                        ? "bg-primary text-white"
                        : "bg-surface text-muted hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="flex-1 px-4 pb-16 pt-4">{children}</main>
        </div>
      </AdminGate>
    </AuthGuard>
  );
}
