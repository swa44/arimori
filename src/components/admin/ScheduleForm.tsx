import Link from "next/link";
import type { ScheduleRow } from "@/lib/supabase/schedules";

function toKoreaLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function ScheduleForm({
  action,
  schedule,
}: {
  action: (formData: FormData) => Promise<void>;
  schedule?: ScheduleRow;
}) {
  return (
    <form action={action} className="schedule-form">
      {schedule && <input type="hidden" name="id" value={schedule.id} />}
      {schedule && <input type="hidden" name="old_poster_path" value={schedule.poster_path ?? ""} />}

      <div className="field field--wide">
        <label htmlFor="title">공연명 *</label>
        <input id="title" name="title" defaultValue={schedule?.title} required maxLength={120} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="start_at">시작 일시 *</label>
          <input id="start_at" name="start_at" type="datetime-local" defaultValue={toKoreaLocalInput(schedule?.start_at ?? null)} required />
        </div>
        <div className="field">
          <label htmlFor="end_at">종료 일시</label>
          <input id="end_at" name="end_at" type="datetime-local" defaultValue={toKoreaLocalInput(schedule?.end_at ?? null)} />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="location">장소명 *</label>
          <input id="location" name="location" defaultValue={schedule?.location} required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="category">공연 유형</label>
          <input id="category" name="category" defaultValue={schedule?.category ?? "기획공연"} maxLength={40} />
        </div>
      </div>

      <div className="field field--wide">
        <label htmlFor="address">주소</label>
        <input id="address" name="address" defaultValue={schedule?.address ?? ""} maxLength={240} />
      </div>

      <div className="field field--wide">
        <label htmlFor="description">공연 소개</label>
        <textarea id="description" name="description" defaultValue={schedule?.description ?? ""} rows={5} maxLength={1200} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="map_url">지도·길찾기 URL</label>
          <input id="map_url" name="map_url" type="url" defaultValue={schedule?.map_url ?? ""} placeholder="https://" />
        </div>
        <div className="field">
          <label htmlFor="booking_url">예매·안내 URL</label>
          <input id="booking_url" name="booking_url" type="url" defaultValue={schedule?.booking_url ?? ""} placeholder="https://" />
        </div>
      </div>

      <div className="field field--wide">
        <label htmlFor="poster">공연 포스터</label>
        <input id="poster" name="poster" type="file" accept="image/jpeg,image/png,image/webp" />
        {schedule?.poster_path && <small>새 이미지를 선택하지 않으면 기존 포스터를 유지합니다.</small>}
      </div>

      <div className="check-row">
        <label><input name="is_public" type="checkbox" defaultChecked={schedule?.is_public ?? true} /> 홈페이지에 공개</label>
        <label><input name="is_featured" type="checkbox" defaultChecked={schedule?.is_featured ?? false} /> 홈 대표 공연</label>
        {schedule && <label><input name="is_cancelled" type="checkbox" defaultChecked={schedule.is_cancelled} /> 취소된 공연</label>}
      </div>

      <div className="form-actions">
        <Link href="/admin" className="secondary-button">취소</Link>
        <button className="primary-button" type="submit">{schedule ? "변경사항 저장" : "일정 등록"}</button>
      </div>
    </form>
  );
}
