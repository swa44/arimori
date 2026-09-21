"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, Mail, PlayCircle, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "홈", icon: Home, color: "olive" },
  { href: "/about", label: "소개", icon: Users, color: "brown" },
  { href: "/schedule", label: "일정", icon: CalendarDays, color: "teal" },
  { href: "/videos", label: "공연영상", icon: PlayCircle, color: "sage" },
  { href: "/contact", label: "공연문의", icon: Mail, color: "olive" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const resetPending = window.setTimeout(() => setPendingHref(null), 0);
    return () => window.clearTimeout(resetPending);
  }, [pathname]);

  useEffect(() => {
    tabs.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <div className="bottom-nav__inner">
        {tabs.map(({ href, label, icon: Icon, color }) => {
          const currentPath = pendingHref ?? pathname;
          const active = href === "/" ? currentPath === "/" : currentPath.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav__item tone-${color} ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-busy={pendingHref === href && pathname !== href}
              onPointerDown={() => setPendingHref(href)}
              onPointerCancel={() => setPendingHref(null)}
            >
              <span className="bottom-nav__icon">
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
