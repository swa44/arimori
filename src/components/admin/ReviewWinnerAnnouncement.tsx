"use client";

import { useActionState } from "react";
import { toggleReviewWinnerAnnouncement } from "@/app/admin/event-actions";

export function ReviewWinnerAnnouncement({ campaignId, announced }: { campaignId: string; announced: boolean }) {
  const [state, action, pending] = useActionState(toggleReviewWinnerAnnouncement, { error: null });
  return <div className="review-winner-announcement-admin">
    <div><strong>당첨자 발표</strong><p>선택한 당첨자의 연락처 뒷자리를 공연 상세에 별도로 공개합니다.</p></div>
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(announced ? "당첨자 발표를 취소할까요?" : "선택한 후기 당첨자를 공개할까요?")) event.preventDefault();
    }}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="next_announced" value={announced ? "" : "on"} />
      <button className="secondary-button" disabled={pending}>{pending ? "처리 중…" : announced ? "발표 취소" : "당첨자 발표"}</button>
    </form>
    {state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}
  </div>;
}
