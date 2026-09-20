"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteInquiry, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function DeleteInquiryButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteInquiry, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state.error) return;
    submittedRef.current = false;
    window.alert(state.error);
  }, [state]);

  return <form
    className="admin-inquiry-delete"
    action={formAction}
    onSubmit={(event) => {
      if (submittedRef.current || !window.confirm(`‘${name}’님의 공연문의를 삭제할까요?\n삭제한 문의는 복구할 수 없습니다.`)) {
        event.preventDefault();
        return;
      }
      submittedRef.current = true;
    }}
  >
    <input type="hidden" name="id" value={id} />
    <button type="submit" disabled={isPending} aria-label={`${name}님의 문의 ${isPending ? "삭제 중" : "삭제"}`}>
      {isPending ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}
    </button>
  </form>;
}
