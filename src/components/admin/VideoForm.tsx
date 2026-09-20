"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import type { AdminActionState } from "@/app/admin/actions";
import type { VideoRow } from "@/lib/supabase/videos";

const initialState: AdminActionState = { error: null };

export function VideoForm({
  action,
  video,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  video?: VideoRow;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (state.error) submittedRef.current = false;
  }, [state]);

  return (
    <form
      action={formAction}
      className="schedule-form"
      onSubmit={(event) => {
        if (submittedRef.current) {
          event.preventDefault();
          return;
        }
        submittedRef.current = true;
      }}
    >
      {video && <input type="hidden" name="id" value={video.id} />}

      <div className="field field--wide">
        <label htmlFor="title">영상 제목 *</label>
        <input id="title" name="title" defaultValue={video?.title ?? ""} required maxLength={120} />
      </div>

      <div className="field field--wide">
        <label htmlFor="youtube_url">유튜브 URL *</label>
        <input
          id="youtube_url"
          name="youtube_url"
          type="text"
          inputMode="url"
          defaultValue={video?.youtube_url ?? ""}
          placeholder="youtube.com/watch?v=... 또는 youtu.be/..."
          required
          maxLength={500}
        />
        <small>일반 영상, Shorts, 공유용 youtu.be 주소를 모두 사용할 수 있습니다.</small>
      </div>

      <div className="field field--wide">
        <label htmlFor="description">영상 설명</label>
        <textarea id="description" name="description" defaultValue={video?.description ?? ""} rows={4} maxLength={500} />
      </div>

      <div className="field">
        <label htmlFor="display_order">표시 순서</label>
        <input id="display_order" name="display_order" type="number" defaultValue={video?.display_order ?? 0} min={0} max={9999} />
        <small>숫자가 작을수록 공연영상 페이지 위쪽에 표시됩니다.</small>
      </div>

      <div className="check-row">
        <label><input name="is_public" type="checkbox" defaultChecked={video?.is_public ?? true} /> 홈페이지에 공개</label>
      </div>

      <div className="form-actions">
        <Link href="/admin?tab=videos" className="secondary-button">취소</Link>
        <button className="primary-button" type="submit" disabled={isPending}>
          {isPending && <LoaderCircle className="spin" size={16} />}
          {isPending ? (video ? "저장 중..." : "등록 중...") : (video ? "변경사항 저장" : "영상 등록")}
        </button>
      </div>
      {state.error && <p className="form-error admin-form-error" role="alert">{state.error}</p>}
    </form>
  );
}
