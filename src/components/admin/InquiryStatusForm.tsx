"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateInquiryStatus, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function InquiryStatusForm({ id, status }: { id: string; status: string }) {
  const [state, formAction, isPending] = useActionState(updateInquiryStatus, initialState);

  return (
    <form className="inquiry-status-form" action={formAction}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="inquiry-status">처리 상태</label>
      <select id="inquiry-status" name="status" defaultValue={status}>
        <option value="new">새 문의</option>
        <option value="in_progress">처리 중</option>
        <option value="completed">처리 완료</option>
      </select>
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending && <LoaderCircle className="spin" size={16} />}
        저장
      </button>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
    </form>
  );
}
