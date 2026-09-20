"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { bulkUpdateReviewState, updateReviewState } from "@/app/admin/event-actions";
import type { EventReview } from "@/lib/supabase/events";

const statusLabel = { pending: "승인 대기", approved: "공개 승인", rejected: "비공개" };

export function ReviewManagementModal({ campaignId, reviews }: { campaignId: string; reviews: EventReview[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | EventReview["status"]>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkState, bulkAction, bulkPending] = useActionState(bulkUpdateReviewState, { error: null });

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase().replace(/\s/g, "");
    return reviews.filter((review) => {
      if (status !== "all" && review.status !== status) return false;
      if (!normalizedQuery) return true;
      const haystack = `${review.phone}${review.content}`.toLocaleLowerCase().replace(/\s/g, "");
      return haystack.includes(normalizedQuery);
    });
  }, [query, reviews, status]);
  const visibleIds = filteredReviews.map((review) => review.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleReview(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
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
    <button className="primary-button admin-review-open" type="button" onClick={() => setOpen(true)}>접수된 후기 관리 <span>{reviews.length}</span></button>
    {open && <div className="admin-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="review-management-title">
        <header><div><h2 id="review-management-title">접수된 후기</h2><p>연락처 또는 후기 내용으로 검색할 수 있습니다.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="후기 관리 닫기"><X size={20} /></button></header>
        <div className="admin-review-filter">
          <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="연락처·후기 내용 검색" autoFocus /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="후기 상태 필터"><option value="all">전체 상태</option><option value="approved">공개 승인</option><option value="rejected">비공개</option><option value="pending">승인 대기</option></select>
        </div>
        <p className="admin-review-result">검색 결과 {filteredReviews.length}개</p>
        <div className="admin-review-bulk">
          <label className="admin-review-select-all"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!visibleIds.length} /><span>현재 결과 전체 선택</span></label>
          <form action={bulkAction} onSubmit={(event) => {
            const action = String(new FormData(event.currentTarget).get("bulk_action") ?? "");
            if (action === "delete" && !window.confirm(`선택한 ${selected.size}개 후기를 삭제할까요?\n삭제한 후기는 복구할 수 없습니다.`)) event.preventDefault();
          }}>
            <input type="hidden" name="campaign_id" value={campaignId} />
            {[...selected].map((id) => <input type="hidden" name="review_ids" value={id} key={id} />)}
            <select name="bulk_action" defaultValue="approved" aria-label="일괄 작업"><option value="approved">공개 승인</option><option value="rejected">비공개</option><option value="winner">당첨 표시</option><option value="unwinner">당첨 해제</option><option value="delete">삭제</option></select>
            <button className="secondary-button" disabled={!selected.size || bulkPending}>{bulkPending ? "처리 중…" : `${selected.size}개 일괄 처리`}</button>
          </form>
          {bulkState.error && <p className="form-message is-error">{bulkState.error}</p>}{bulkState.success && <p className="form-message is-success">{bulkState.success}</p>}
        </div>
        <div className="admin-review-list">{filteredReviews.length === 0 && <p className="admin-empty">조건에 맞는 후기가 없습니다.</p>}{filteredReviews.map((review) => <article key={review.id}>
          <div className="admin-review-list__row"><label className="admin-review-checkbox"><input type="checkbox" checked={selected.has(review.id)} onChange={() => toggleReview(review.id)} aria-label={`${review.phone} 후기 선택`} /></label><div className="admin-review-list__body"><div className="admin-review-list__meta"><strong>{review.phone}</strong><em className={`review-state is-${review.status}`}>{statusLabel[review.status]}</em>{review.is_winner && <em className="review-winner">당첨</em>}</div>
          <p>{review.content}</p><small>{review.public_agreed ? "홈페이지 공개 대상" : "기존 공개 미동의 기록"}</small>
          <div className="admin-review-list__actions"><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={campaignId} /><button name="action" value="approved">공개 승인</button></form><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={campaignId} /><button name="action" value="rejected">비공개</button></form><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={campaignId} /><input type="hidden" name="next_winner" value={review.is_winner ? "" : "on"} /><button name="action" value="winner">{review.is_winner ? "당첨 해제" : "당첨 표시"}</button></form><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={campaignId} /><button className="text-danger" name="action" value="delete">삭제</button></form></div>
          </div></div>
        </article>)}</div>
      </section>
    </div>}
  </>;
}
