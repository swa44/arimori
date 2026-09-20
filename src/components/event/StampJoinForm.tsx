"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { joinStampProgram, type EventActionState } from "@/app/event/actions";

const initialState: EventActionState = { error: null };

export function StampJoinForm({ programId, slug }: { programId: string; slug: string }) {
  const [state, action, pending] = useActionState(joinStampProgram, initialState);
  return <form className="event-form" action={action}>
    <input type="hidden" name="program_id" value={programId} />
    <input type="hidden" name="slug" value={slug} />
    <label><span>이름 또는 별명</span><input name="display_name" maxLength={30} required /></label>
    <label><span>연락처</span><input name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" required /></label>
    <label className="event-check"><input name="privacy_agreed" type="checkbox" required /><span>스탬프 참여 확인과 경품 지급을 위한 개인정보 수집 및 이용에 동의합니다.</span></label>
    <button className="primary-button event-submit" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={17} />}{pending ? "참여 중..." : "모바일 스탬프 참여하기"}</button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
  </form>;
}
