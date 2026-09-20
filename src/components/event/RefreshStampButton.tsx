"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshStampButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="secondary-button event-refresh" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    <RefreshCw size={16} className={pending ? "is-spinning" : ""} /> {pending ? "확인 중" : "스탬프 새로고침"}
  </button>;
}
