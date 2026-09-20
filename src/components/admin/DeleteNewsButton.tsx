"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteNews, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function DeleteNewsButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, isPending] = useActionState(deleteNews, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state.error) return;
    submittedRef.current = false;
    window.alert(state.error);
  }, [state]);

  return <form action={formAction} onSubmit={(event) => {
    if (submittedRef.current || !window.confirm(`‘${title}’ 소식을 삭제할까요?`)) {
      event.preventDefault();
      return;
    }
    submittedRef.current = true;
  }}>
    <input type="hidden" name="id" value={id} />
    <button type="submit" disabled={isPending} aria-label={`${title} ${isPending ? "삭제 중" : "삭제"}`}>
      {isPending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
    </button>
  </form>;
}
