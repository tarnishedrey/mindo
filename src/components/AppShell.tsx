"use client";

import { Compass, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useConns } from "@/lib/hooks";
import { cx } from "./ui";

const nav = [
  { href: "/discover", label: "Cari", icon: Compass },
  { href: "/connections", label: "Koneksi", icon: UsersRound },
  { href: "/me", label: "Profil", icon: UserRound },
];

export function AppShell({
  title,
  subtitle,
  action,
  children,
  me,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  me: string;
}) {
  const path = usePathname();
  const { incoming } = useConns(me);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            const badge = href === "/connections" && incoming.length > 0 ? incoming.length : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex flex-col items-center gap-1 pt-2.5 text-xs font-medium",
                    active ? "text-brand" : "text-faint hover:text-muted",
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute left-1/2 top-1.5 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PlainShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-canvas">{children}</div>;
}
