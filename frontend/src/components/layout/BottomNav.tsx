"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookIcon,
  ClipboardIcon,
  HomeIcon,
  SettingsIcon,
  TaskIcon,
} from "@/components/ui/icons";

const items = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/courses", label: "Courses", Icon: BookIcon },
  { href: "/quizzes", label: "Quizzes", Icon: ClipboardIcon },
  { href: "/homework", label: "Tasks", Icon: TaskIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-screen-sm border-t border-line bg-surface/95 px-2 backdrop-blur">
      <ul className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition",
                  active ? "text-primary" : "text-muted hover:text-ink",
                )}
              >
                <Icon className={cn("size-6 transition-transform", active && "scale-110")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
