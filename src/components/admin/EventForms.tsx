"use client";

import { useActionState, useState } from "react";
import type { AdminActionState } from "@/app/admin/actions";
import { addStampBooth, createReviewCampaign, createStampProgram, updateBoothAccessCode, updateReviewCampaign, updateStampProgram } from "@/app/admin/event-actions";
import type { ReviewCampaign, StampProgram } from "@/lib/supabase/events";

const initial: AdminActionState = { error: null };
const localDateTime = (value?: string) => value ? new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";

function Message({ state }: { state: AdminActionState }) { return <>{state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}</>; }

type ScheduleOption = { id: string; title: string; start_at: string };

export function StampProgramForm({ program, schedules = [] }: { program?: StampProgram; schedules?: ScheduleOption[] }) {
  const action = program ? updateStampProgram : createStampProgram;
  const [state, formAction, pending] = useActionState(action, initial);
  return <form action={formAction} className="admin-form admin-event-form">
    {program && <input type="hidden" name="id" value={program.id} />}
    <label><span>프로그램명</span><input name="title" required defaultValue={program?.title} placeholder="어린이 예술 체험 한마당" /></label>
    {!program && <label><span>영문 주소</span><input name="slug" required placeholder="art-stamp-2026" pattern="[A-Za-z0-9-]+" /><small>/event/stamp/영문주소 로 사용됩니다.</small></label>}
    <label><span>연결할 공연 일정</span><select name="schedule_id" defaultValue={program?.schedule_id ?? ""}><option value="">연결하지 않음</option>{schedules.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.start_at.slice(0, 10)}</option>)}</select><small>연결하면 해당 공연 상세에 스탬프 참여 버튼이 표시됩니다.</small></label>
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
    <label><span>담당자 인증코드</span><input name="access_code" type="text" inputMode="numeric" pattern="[0-9]{6,}" minLength={6} required autoComplete="off" placeholder="숫자 6자리 이상" /><small>초청한 부스 담당자가 로그인할 때 사용하는 코드입니다.</small></label>
    <Message state={state} /><button className="secondary-button" disabled={pending}>{pending ? "추가 중…" : "부스 추가"}</button>
  </form>;
}

export function BoothCodeForm({ boothId, programId, configured, currentCode }: { boothId: string; programId: string; configured: boolean; currentCode?: string | null }) {
  const [state, formAction, pending] = useActionState(updateBoothAccessCode, initial);
  const [copied, setCopied] = useState(false);

  async function copyCurrentCode() {
    if (!currentCode) return;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(currentCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = currentCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("인증코드를 복사해 주세요.", currentCode);
    }
  }

  return <form action={formAction} className="booth-code-form"><input type="hidden" name="id" value={boothId} /><input type="hidden" name="program_id" value={programId} />
    <div className="booth-code-current"><span>현재 인증코드</span>{currentCode ? <><code>{currentCode}</code><button type="button" onClick={copyCurrentCode}>{copied ? "복사됨" : "복사"}</button></> : <small>{configured ? "기존 코드는 확인할 수 없습니다. 새 코드로 변경해 주세요." : "설정되지 않음"}</small>}</div>
    <input name="access_code" type="text" inputMode="numeric" pattern="[0-9]{6,}" minLength={6} required autoComplete="off" aria-label="새 담당자 인증코드" placeholder={configured ? "새 숫자 코드 6자리 이상" : "숫자 코드 6자리 이상"} />
    <button className="secondary-button" disabled={pending}>{pending ? "변경 중…" : configured ? "코드 변경" : "코드 설정"}</button>
    {state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}
  </form>;
}

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
