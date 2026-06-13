"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/");
  }, [status, router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-7 flex flex-col items-center text-center">
        <Image
          src="/icon.svg"
          alt="ClassMate"
          width={64}
          height={64}
          className="mb-3 rounded-2xl shadow-[var(--shadow-soft)]"
          priority
        />
        <h1 className="text-2xl font-extrabold tracking-tight">ClassMate</h1>
        <p className="text-sm text-muted">Your university class companion</p>
      </div>
      {children}
    </div>
  );
}
