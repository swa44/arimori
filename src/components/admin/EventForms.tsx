"use client";

import { useActionState } from "react";
import type { AdminActionState } from "@/app/admin/actions";
import { addStampBooth, createReviewCampaign, createStampProgram, updateReviewCampaign, updateStampProgram } from "@/app/admin/event-actions";
import type { ReviewCampaign, StampProgram } from "@/lib/supabase/events";

const initial: AdminActionState = { error: null };
const localDateTime = (value?: string) => value ? new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";

function Message({ state }: { state: AdminActionState }) { return <>{state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}</>; }

export function StampProgramForm({ program }: { program?: StampProgram }) {
  const action = program ? updateStampProgram : createStampProgram;
  const [state, formAction, pending] = useActionState(action, initial);
  return <form action={formAction} className="admin-form admin-event-form">
    {program && <input type="hidden" name="id" value={program.id} />}
    <label><span>프로그램명</span><input name="title" required defaultValue={program?.title} placeholder="어린이 예술 체험 한마당" /></label>
    {!program && <label><span>영문 주소</span><input name="slug" required placeholder="art-stamp-2026" pattern="[A-Za-z0-9-]+" /><small>/event/stamp/영문주소 로 사용됩니다.</small></label>}
    <label><span>안내 내용</span><textarea name="description" rows={4} defaultValue={program?.description ?? ""} /></label>
    <div className="admin-form__row"><label><span>시작일</span><input type="date" name="starts_on" required defaultValue={program?.starts_on} /></label><label><span>종료일</span><input type="date" name="ends_on" required defaultValue={program?.ends_on} /></label></div>
    <label><span>완료에 필요한 스탬프 수</span><input type="number" name="required_stamps" min="1" max="100" required defaultValue={program?.required_stamps ?? 1} /></label>
    <label className="admin-check"><input type="checkbox" name="is_active" defaultChecked={program?.is_active ?? true} /> 참여 페이지 공개</label>
    <Message state={state} /><button className="primary-button" disabled={pending}>{pending ? "저장 중…" : program ? "변경사항 저장" : "스탬프 프로그램 만들기"}</button>
  </form>;
}

export function BoothForm({ programId }: { programId: string }) {
  const [state, formAction, pending] = useActionState(addStampBooth, initial);
  return <form action={formAction} className="admin-form admin-booth-form"><input type="hidden" name="program_id" value={programId} />
    <div className="admin-form__row"><label><span>부스명</span><input name="name" required placeholder="전통악기 체험" /></label><label><span>짧은 설명</span><input name="description" placeholder="선택 입력" /></label></div>
    <Message state={state} /><button className="secondary-button" disabled={pending}>{pending ? "추가 중…" : "부스 추가"}</button>
  </form>;
}

type ScheduleOption = { id: string; title: string; start_at: string };
export function ReviewCampaignForm({ campaign, schedules = [] }: { campaign?: ReviewCampaign; schedules?: ScheduleOption[] }) {
  const action = campaign ? updateReviewCampaign : createReviewCampaign;
  const [state, formAction, pending] = useActionState(action, initial);
  return <form action={formAction} className="admin-form admin-event-form">
    {campaign && <input type="hidden" name="id" value={campaign.id} />}
    {!campaign && <label><span>연결할 공연</span><select name="schedule_id" required defaultValue=""><option value="" disabled>공연 선택</option>{schedules.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.start_at.slice(0, 10)}</option>)}</select></label>}
    <label><span>후기 이벤트명</span><input name="title" required defaultValue={campaign?.title} placeholder="공연 후기 남기기" /></label>
    <div className="admin-form__row"><label><span>참여 시작</span><input type="datetime-local" name="opens_at" required defaultValue={localDateTime(campaign?.opens_at)} /></label><label><span>참여 종료</span><input type="datetime-local" name="closes_at" required defaultValue={localDateTime(campaign?.closes_at)} /></label></div>
    <label className="admin-check"><input type="checkbox" name="is_active" defaultChecked={campaign?.is_active ?? true} /> 후기 접수 공개</label>
    <Message state={state} /><button className="primary-button" disabled={pending}>{pending ? "저장 중…" : campaign ? "변경사항 저장" : "후기 이벤트 만들기"}</button>
  </form>;
}
