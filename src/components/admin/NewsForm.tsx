"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import type { AdminActionState } from "@/app/admin/actions";
import type { NewsRow } from "@/lib/supabase/news";

const initialState: AdminActionState = { error: null };

export function NewsForm({
  action,
  news,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  news?: NewsRow;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (state.error) submittedRef.current = false;
  }, [state]);

  return <form action={formAction} className="schedule-form" onSubmit={(event) => {
    if (submittedRef.current) event.preventDefault();
    else submittedRef.current = true;
  }}>
    {news && <input type="hidden" name="id" value={news.id} />}
    <div className="field">
      <label htmlFor="badge">뱃지 문구 *</label>
      <input id="badge" name="badge" defaultValue={news?.badge ?? ""} placeholder="소식, 기록, 안내 등" maxLength={20} required />
    </div>
    <div className="field field--wide">
      <label htmlFor="title">제목 *</label>
      <textarea id="title" name="title" defaultValue={news?.title ?? ""} rows={2} maxLength={160} required />
    </div>
    <div className="field field--wide">
      <label htmlFor="content">내용 *</label>
      <textarea id="content" name="content" defaultValue={news?.content ?? ""} rows={9} maxLength={5000} required />
      <small>줄바꿈을 포함해 입력한 형태로 소식 모달에 표시됩니다.</small>
    </div>
    <div className="form-actions">
      <Link href="/admin?tab=news" className="secondary-button">취소</Link>
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending && <LoaderCircle className="spin" size={16} />}
        {isPending ? (news ? "저장 중..." : "등록 중...") : (news ? "변경사항 저장" : "소식 등록")}
      </button>
    </div>
    {state.error && <p className="form-error admin-form-error" role="alert">{state.error}</p>}
  </form>;
}
