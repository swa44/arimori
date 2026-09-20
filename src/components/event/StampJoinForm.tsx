"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { findStampCard, joinStampProgram, type EventActionState } from "@/app/event/actions";

const initialState: EventActionState = { error: null };

export function StampJoinForm({ programId, slug }: { programId: string; slug: string }) {
  const [mode, setMode] = useState<"join" | "find">("join");
  const [joinState, joinAction, joinPending] = useActionState(joinStampProgram, initialState);
  const [findState, findAction, findPending] = useActionState(findStampCard, initialState);

  return <div className="stamp-entry">
    <div className="stamp-entry__tabs" role="tablist" aria-label="스탬프 카드 이용 방법">
      <button type="button" role="tab" aria-selected={mode === "join"} className={mode === "join" ? "is-active" : ""} onClick={() => setMode("join")}>처음 참여하기</button>
      <button type="button" role="tab" aria-selected={mode === "find"} className={mode === "find" ? "is-active" : ""} onClick={() => setMode("find")}>내 카드 찾기</button>
    </div>

    {mode === "join" ? <form className="event-form" action={joinAction}>
      <input type="hidden" name="program_id" value={programId} />
      <input type="hidden" name="slug" value={slug} />
      <label><span>이름 또는 별명</span><input name="display_name" maxLength={30} required /></label>
      <label><span>연락처</span><input name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" required /></label>
      <label className="event-check"><input name="privacy_agreed" type="checkbox" required /><span>스탬프 참여 확인과 경품 지급을 위한 개인정보 수집 및 이용에 동의합니다.</span></label>
      <button className="primary-button event-submit" type="submit" disabled={joinPending}>{joinPending && <LoaderCircle className="spin" size={17} />}{joinPending ? "참여 중..." : "모바일 스탬프 참여하기"}</button>
      {joinState.error && <p className="form-error" role="alert">{joinState.error}</p>}
    </form> : <form className="event-form stamp-find-form" action={findAction}>
      <input type="hidden" name="program_id" value={programId} />
      <input type="hidden" name="slug" value={slug} />
      <p>처음 참여할 때 입력한 연락처로 기존 스탬프 카드를 불러옵니다.</p>
      <label><span>연락처</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" required /></label>
      <button className="secondary-button event-submit" type="submit" disabled={findPending}>{findPending ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{findPending ? "찾는 중..." : "내 스탬프 카드 찾기"}</button>
      {findState.error && <p className="form-error" role="alert">{findState.error}</p>}
    </form>}
  </div>;
}
