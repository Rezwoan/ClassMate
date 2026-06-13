"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Semester } from "@/lib/types";
import { PageLoader } from "@/components/ui/primitives";

/**
 * Redirects guests to /login. When `requireSemester` is set, also redirects to
 * /onboarding until an active semester exists.
 */
export function AuthGuard({
  children,
  requireSemester = false,
}: {
  children: React.ReactNode;
  requireSemester?: boolean;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [semesterReady, setSemesterReady] = useState(!requireSemester);

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  useEffect(() => {
    if (status !== "authed" || !requireSemester) return;
    let active = true;
    api<Semester | null>("/semesters/active")
      .then((s) => {
        if (!active) return;
        if (!s) router.replace("/onboarding");
        else setSemesterReady(true);
      })
      .catch(() => active && setSemesterReady(true));
    return () => {
      active = false;
    };
  }, [status, requireSemester, router]);

  if (status === "loading" || status === "guest") return <PageLoader />;
  if (requireSemester && !semesterReady) return <PageLoader />;
  return <>{children}</>;
}
