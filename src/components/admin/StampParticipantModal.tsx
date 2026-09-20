"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { bulkUpdateStampWinners, toggleStampWinnerAnnouncement, updateStampWinner } from "@/app/admin/event-actions";
import type { StampParticipant } from "@/lib/supabase/events";

type ParticipantProgress = StampParticipant & { stampCount: number };
type ParticipantFilter = "all" | "progress" | "complete" | "winner";

export function StampParticipantModal({ programId, requiredStamps, winnersAnnounced, participants }: { programId: string; requiredStamps: number; winnersAnnounced: boolean; participants: ParticipantProgress[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ParticipantFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkState, bulkAction, bulkPending] = useActionState(bulkUpdateStampWinners, { error: null });
  const [announcementState, announcementAction, announcementPending] = useActionState(toggleStampWinnerAnnouncement, { error: null });

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.replace(/\D/g, "");
    return participants.filter((participant) => {
      if (status === "progress" && participant.completed_at) return false;
      if (status === "complete" && !participant.completed_at) return false;
      if (status === "winner" && !participant.is_winner) return false;
      return !normalizedQuery || participant.phone.replace(/\D/g, "").includes(normalizedQuery);
    });
  }, [participants, query, status]);
  const selectableIds = filteredParticipants.filter((participant) => participant.completed_at).map((participant) => participant.id);
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleParticipant(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) selectableIds.forEach((id) => next.delete(id));
      else selectableIds.forEach((id) => next.add(id));
      return next;
    });
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return <>
    <div className="stamp-participant-buttons">
      <button className="primary-button admin-review-open" type="button" onClick={() => setOpen(true)}>스탬프 참여 현황 <span>{participants.length}</span></button>
      <form action={announcementAction} onSubmit={(event) => {
        if (!window.confirm(winnersAnnounced ? "당첨자 발표를 취소할까요?" : "선택한 당첨자를 참가자 화면에 발표할까요?")) event.preventDefault();
      }}>
        <input type="hidden" name="program_id" value={programId} />
        <input type="hidden" name="next_announced" value={winnersAnnounced ? "" : "on"} />
        <button className="secondary-button stamp-winner-announce" disabled={announcementPending}>{announcementPending ? "처리 중…" : winnersAnnounced ? "발표 취소" : "당첨자 발표"}</button>
      </form>
    </div>
    {announcementState.error && <p className="form-message is-error stamp-announcement-message">{announcementState.error}</p>}{announcementState.success && <p className="form-message is-success stamp-announcement-message">{announcementState.success}</p>}
    {open && <div className="admin-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="stamp-participant-title">
        <header><div><h2 id="stamp-participant-title">스탬프 참여 현황</h2><p>스탬프 완료자 중 당첨자를 선택할 수 있습니다.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="참여 현황 닫기"><X size={20} /></button></header>
        <div className="admin-review-filter">
          <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="연락처 검색" autoFocus /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as ParticipantFilter)} aria-label="참여 상태 필터"><option value="all">전체 상태</option><option value="progress">참여 중</option><option value="complete">스탬프 완료</option><option value="winner">당첨자</option></select>
        </div>
        <p className="admin-review-result">검색 결과 {filteredParticipants.length}명</p>
        <div className="admin-review-bulk">
          <label className="admin-review-select-all"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!selectableIds.length} /><span>현재 완료자 전체 선택</span></label>
          <form action={bulkAction}>
            <input type="hidden" name="program_id" value={programId} />
            {[...selected].map((id) => <input type="hidden" name="participant_ids" value={id} key={id} />)}
            <select name="bulk_action" defaultValue="winner" aria-label="일괄 작업"><option value="winner">당첨 표시</option><option value="unwinner">당첨 해제</option></select>
            <button className="secondary-button" disabled={!selected.size || bulkPending}>{bulkPending ? "처리 중…" : `${selected.size}명 일괄 처리`}</button>
          </form>
          {bulkState.error && <p className="form-message is-error">{bulkState.error}</p>}{bulkState.success && <p className="form-message is-success">{bulkState.success}</p>}
        </div>
        <div className="admin-review-list admin-stamp-participant-list">{filteredParticipants.length === 0 && <p className="admin-empty">조건에 맞는 참여자가 없습니다.</p>}{filteredParticipants.map((participant) => {
          const completedCount = Math.min(participant.stampCount, requiredStamps);
          return <article key={participant.id}>
            <div className="admin-review-list__row"><label className="admin-review-checkbox"><input type="checkbox" checked={selected.has(participant.id)} onChange={() => toggleParticipant(participant.id)} disabled={!participant.completed_at} aria-label={`${participant.phone} 참여자 선택`} /></label><div className="admin-review-list__body">
              <div className="admin-review-list__meta"><strong>{participant.phone}</strong><em className={`stamp-participant-state is-${participant.completed_at ? "complete" : "progress"}`}>{participant.completed_at ? "스탬프 완료" : "참여 중"}</em>{participant.is_winner && <em className="review-winner">당첨</em>}</div>
              <div className="stamp-participant-progress"><div><span style={{ width: `${requiredStamps ? completedCount / requiredStamps * 100 : 0}%` }} /></div><strong>{completedCount} / {requiredStamps} 완료</strong></div>
              {participant.completed_at && <div className="admin-review-list__actions"><form action={updateStampWinner}><input type="hidden" name="participant_id" value={participant.id} /><input type="hidden" name="program_id" value={programId} /><input type="hidden" name="next_winner" value={participant.is_winner ? "" : "on"} /><button>{participant.is_winner ? "당첨 해제" : "당첨 표시"}</button></form></div>}
            </div></div>
          </article>;
        })}</div>
      </section>
    </div>}
  </>;
}
