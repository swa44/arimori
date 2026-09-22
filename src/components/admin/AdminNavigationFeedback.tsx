"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AdminNavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const resetPending = window.setTimeout(() => setPending(false), 0);
    return () => window.clearTimeout(resetPending);
  }, [routeKey]);

  useEffect(() => {
    if (!pending) return;
    const safetyReset = window.setTimeout(() => setPending(false), 10000);
    return () => window.clearTimeout(safetyReset);
  }, [pending]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
      ) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== window.location.origin || !target.pathname.startsWith("/admin")) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${target.pathname}${target.search}`;
      if (current !== next) setPending(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!pending) return null;

  return (
    <div className="admin-route-loading-overlay" role="status" aria-live="polite">
      <span className="route-loading-spinner" aria-hidden="true" />
      <span className="sr-only">관리자 페이지를 불러오는 중입니다.</span>
    </div>
  );
}
