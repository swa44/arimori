"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { submitEventReview, type EventActionState } from "@/app/event/actions";

const initialState: EventActionState = { error: null };

export function EventReviewForm({ accessToken }: { accessToken: string }) {
  const [state, action, pending] = useActionState(submitEventReview, initialState);
  if (state.success) return <div className="event-success"><strong>접수 완료</strong><p>{state.success}</p></div>;

  return <form className="event-form" action={action}>
    <input type="hidden" name="access_token" value={accessToken} />
    <label><span>이름 또는 별명</span><input name="display_name" maxLength={30} required /></label>
    <label><span>연락처</span><input name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" required /><small>연락처는 중복 참여 확인과 당첨 안내에만 사용됩니다.</small></label>
    <label><span>공연 후기</span><textarea name="content" rows={6} maxLength={500} placeholder="오늘 공연에서 기억에 남은 순간을 들려주세요." required /></label>
    <label className="event-check"><input name="privacy_agreed" type="checkbox" required /><span>추첨과 당첨 안내를 위한 개인정보 수집 및 이용에 동의합니다.</span></label>
    <label className="event-check"><input name="public_agreed" type="checkbox" /><span>작성한 후기와 이름 또는 별명이 홈페이지에 공개되는 것에 동의합니다.</span></label>
    <button className="primary-button event-submit" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={17} />}{pending ? "접수 중..." : "후기 남기고 추첨 참여하기"}</button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
  </form>;
}
