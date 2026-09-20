"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteVideo, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function DeleteVideoButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, isPending] = useActionState(deleteVideo, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state.error) return;
    submittedRef.current = false;
    window.alert(state.error);
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (submittedRef.current || !window.confirm(`‘${title}’ 영상을 삭제할까요?`)) {
          event.preventDefault();
          return;
        }
        submittedRef.current = true;
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button aria-label={`${title} ${isPending ? "삭제 중" : "삭제"}`} disabled={isPending} type="submit">
        {isPending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
      </button>
    </form>
  );
}
