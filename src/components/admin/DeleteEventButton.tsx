"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteReviewCampaign, deleteStampProgram } from "@/app/admin/event-actions";
import type { AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function DeleteEventButton({ id, title, type }: { id: string; title: string; type: "stamp" | "review" }) {
  const action = type === "stamp" ? deleteStampProgram : deleteReviewCampaign;
  const [state, formAction, pending] = useActionState(action, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state.error) return;
    submittedRef.current = false;
    window.alert(state.error);
  }, [state]);

  const detail = type === "stamp"
    ? "부스, 참여자와 모든 스탬프 기록도 함께 삭제되며 복구할 수 없습니다."
    : "이 이벤트로 접수된 후기와 당첨 표시도 함께 삭제되며 복구할 수 없습니다.";

  return <form className="admin-event-delete" action={formAction} onSubmit={(event) => {
    if (submittedRef.current || !window.confirm(`‘${title}’ 이벤트 전체를 삭제할까요?\n${detail}\n연결된 공연 일정 자체는 삭제되지 않습니다.`)) {
      event.preventDefault();
      return;
    }
    submittedRef.current = true;
  }}>
    <input type="hidden" name="id" value={id} />
    <button type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}{pending ? "삭제 중…" : "이벤트 전체 삭제"}</button>
  </form>;
}
