"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateInquirySettings, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function InquirySettingsForm({ phone }: { phone: string }) {
  const [state, formAction, isPending] = useActionState(updateInquirySettings, initialState);
  return (
    <form className="inquiry-settings" action={formAction}>
      <div>
        <label htmlFor="notification-phone">문의 알림 수신번호</label>
        <p>새 문의가 접수되면 관리자 상세 링크를 이 번호로 보냅니다.</p>
      </div>
      <input id="notification-phone" name="notification_phone" type="tel" inputMode="tel" defaultValue={phone} placeholder="010-0000-0000" required />
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending && <LoaderCircle className="spin" size={16} />}
        {isPending ? "저장 중" : "저장"}
      </button>
      {state.error && <p className="form-error inquiry-settings__result" role="alert">{state.error}</p>}
      {state.success && <p className="inquiry-settings__result is-success" role="status">{state.success}</p>}
    </form>
  );
}
