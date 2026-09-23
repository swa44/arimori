/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { GripVertical, Image as ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
import type { AdminActionState } from "@/app/admin/actions";
import type { BookingType } from "@/data/content";
import { createClientImageId, optimizeImageForWeb } from "@/lib/images/optimize";
import { getPosterUrl, type ScheduleRow } from "@/lib/supabase/schedules";

const initialState: AdminActionState = { error: null };
type PosterItem = { id: string; kind: "existing"; path: string; previewUrl: string } | { id: string; kind: "new"; file: File; previewUrl: string };

function toKoreaLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function ScheduleForm({
  action,
  schedule,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  schedule?: ScheduleRow;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const submittedRef = useRef(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const draggedPosterId = useRef<string | null>(null);
  const objectUrls = useRef<string[]>([]);
  const [isPosterDragging, setIsPosterDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [posterItems, setPosterItems] = useState<PosterItem[]>(() => {
    const paths = schedule?.poster_paths?.length ? schedule.poster_paths : schedule?.poster_path ? [schedule.poster_path] : [];
    return paths.map((path, index) => ({ id: `existing:${index}`, kind: "existing" as const, path, previewUrl: getPosterUrl(path) ?? "" }));
  });
  const [posterError, setPosterError] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>(
    schedule?.booking_type ?? (schedule?.booking_url ? "reservation" : "free"),
  );

  useEffect(() => {
    if (state.error) submittedRef.current = false;
  }, [state]);

  useEffect(() => {
    const input = posterInputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    posterItems.forEach((item) => { if (item.kind === "new") transfer.items.add(item.file); });
    input.files = transfer.files;
  }, [posterItems]);

  useEffect(() => () => { objectUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  async function addPosterFiles(files: File[]) {
    if (!files.length) return;
    if (posterItems.length + files.length > 10) {
      setPosterError("포스터는 최대 10장까지 등록할 수 있습니다.");
      return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setPosterError("JPG, PNG, WEBP 이미지 파일만 등록할 수 있습니다.");
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setPosterError("포스터 파일은 장당 10MB 이하로 등록해 주세요.");
      return;
    }
    setPosterError("");
    setIsOptimizing(true);
    try {
      const optimized: File[] = [];
      for (const file of files) optimized.push(await optimizeImageForWeb(file));
      const existingUploadSize = posterItems.reduce((total, item) => total + (item.kind === "new" ? item.file.size : 0), 0);
      const nextUploadSize = optimized.reduce((total, file) => total + file.size, existingUploadSize);
      if (nextUploadSize > 3.5 * 1024 * 1024) throw new Error("최적화된 포스터 전체 용량이 큽니다. 나누어 등록해 주세요.");
      const newItems = optimized.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.push(previewUrl);
        return { id: `new:${createClientImageId()}`, kind: "new" as const, file, previewUrl };
      });
      setPosterItems((current) => [...current, ...newItems]);
    } catch (error) {
      setPosterError(error instanceof Error ? error.message : "포스터를 최적화하지 못했습니다.");
    } finally {
      setIsOptimizing(false);
    }
  }

  function removePoster(id: string) {
    setPosterItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function movePoster(targetId: string) {
    const sourceId = draggedPosterId.current;
    if (!sourceId || sourceId === targetId) return;
    setPosterItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  return (
    <form
      action={formAction}
      className="schedule-form"
      onSubmit={(event) => {
        if (isOptimizing) {
          event.preventDefault();
          return;
        }
        if (submittedRef.current) {
          event.preventDefault();
          return;
        }
        submittedRef.current = true;
      }}
    >
      {schedule && <input type="hidden" name="id" value={schedule.id} />}
      {schedule && <input type="hidden" name="old_poster_path" value={schedule.poster_path ?? ""} />}
      {schedule && <input type="hidden" name="old_poster_paths" value={JSON.stringify(schedule.poster_paths ?? [])} />}
      <input type="hidden" name="poster_order" value={JSON.stringify(posterItems.map((item) => item.id))} />
      <input type="hidden" name="new_poster_ids" value={JSON.stringify(posterItems.filter((item) => item.kind === "new").map((item) => item.id))} />

      <div className="field field--wide">
        <label htmlFor="title">공연명 *</label>
        <textarea id="title" name="title" defaultValue={schedule?.title} rows={2} required maxLength={120} />
        <small>원하는 위치에서 줄바꿈할 수 있습니다.</small>
      </div>

      <div className="field field--wide">
        <label htmlFor="start_at">공연 일시 *</label>
        <input id="start_at" name="start_at" type="datetime-local" defaultValue={toKoreaLocalInput(schedule?.start_at ?? null)} required />
      </div>

      <div className="field field--wide">
        <label htmlFor="location">장소명 *</label>
        <input id="location" name="location" defaultValue={schedule?.location} required maxLength={120} />
      </div>

      <div className="field field--wide">
        <label htmlFor="map_query">길찾기 검색 문구 *</label>
        <input
          id="map_query"
          name="map_query"
          defaultValue={schedule?.map_query ?? schedule?.location ?? ""}
          placeholder="예: 이천중학교"
          required
          maxLength={160}
        />
        <small>네이버 지도, 카카오맵, TMAP에서 검색할 정확한 장소명이나 지역명을 함께 입력해 주세요.</small>
      </div>

      <div className="field field--wide">
        <label htmlFor="description">공연 소개</label>
        <textarea id="description" name="description" defaultValue={schedule?.description ?? ""} rows={5} maxLength={1200} />
      </div>

      <fieldset className="ticket-type-field">
        <legend>예매 방식 *</legend>
        <div className="ticket-type-options">
          <label><input name="booking_type" type="radio" value="reservation" checked={bookingType === "reservation"} onChange={() => setBookingType("reservation")} /> 예매 공연</label>
          <label><input name="booking_type" type="radio" value="free" checked={bookingType === "free"} onChange={() => setBookingType("free")} /> 무료 공연</label>
          <label><input name="booking_type" type="radio" value="onsite" checked={bookingType === "onsite"} onChange={() => setBookingType("onsite")} /> 현장 발권</label>
        </div>
      </fieldset>

      {bookingType === "reservation" && (
        <div className="field field--wide">
          <label htmlFor="booking_url">공연 예매 URL *</label>
          <input id="booking_url" name="booking_url" type="text" inputMode="url" defaultValue={schedule?.booking_url ?? ""} placeholder="ticket.example.com" required maxLength={500} />
          <small>https://를 생략해도 자동으로 추가됩니다.</small>
        </div>
      )}

      <div className="field field--wide">
        <label htmlFor="posters">공연 포스터</label>
        <label
          className={`poster-dropzone${isPosterDragging ? " is-dragging" : ""}${posterItems.length ? " has-file" : ""}`}
          htmlFor="posters"
          onDragEnter={(event) => { event.preventDefault(); setIsPosterDragging(true); }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setIsPosterDragging(true); }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPosterDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsPosterDragging(false);
            void addPosterFiles(Array.from(event.dataTransfer.files));
          }}
        >
          {posterItems.length ? <ImageIcon size={25} /> : <UploadCloud size={27} />}
          <span>
            <strong>{posterItems.length ? `${posterItems.length}장 등록 예정` : "포스터를 여기에 끌어다 놓으세요"}</strong>
            <small>{isOptimizing ? "가로 800px WebP로 최적화하고 있습니다." : posterItems.length ? "이미지를 추가하려면 클릭하거나 파일을 끌어오세요." : "여러 장 선택 · 가로 최대 800px WebP 자동 최적화 · 최대 10장"}</small>
          </span>
        </label>
        <input
          ref={posterInputRef}
          className="poster-file-input"
          id="posters"
          name="posters"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            void addPosterFiles(files);
          }}
        />
        {posterError && <small className="form-error" role="alert">{posterError}</small>}
        {posterItems.length > 0 && <div className="poster-preview-list" aria-label="포스터 순서">
          {posterItems.map((item, index) => <article
            className="poster-preview"
            draggable
            key={item.id}
            onDragStart={(event) => { draggedPosterId.current = item.id; event.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
            onDrop={(event) => { event.preventDefault(); movePoster(item.id); }}
            onDragEnd={() => { draggedPosterId.current = null; }}
          >
            <span className="poster-preview__order">{index + 1}</span>
            {item.previewUrl ? <img src={item.previewUrl} alt={`포스터 미리보기 ${index + 1}`} /> : <span className="poster-preview__fallback"><ImageIcon size={20} /></span>}
            <span className="poster-preview__meta"><GripVertical size={15} /><small>{item.kind === "existing" ? "등록된 이미지" : item.file.name}</small></span>
            <button type="button" onClick={() => removePoster(item.id)} aria-label={`포스터 ${index + 1} 삭제`}><X size={15} /></button>
          </article>)}
        </div>}
        {posterItems.length > 1 && <small>마우스로 이미지를 끌어 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표로 표시됩니다.</small>}
      </div>

      {schedule && (
        <div className="check-row">
          <label><input name="is_cancelled" type="checkbox" defaultChecked={schedule.is_cancelled} /> 취소된 공연</label>
        </div>
      )}

      <div className="form-actions">
        <Link href="/admin" className="secondary-button">취소</Link>
        <button className="primary-button" type="submit" disabled={isPending || isOptimizing}>
          {(isPending || isOptimizing) && <LoaderCircle className="spin" size={16} />}
          {isOptimizing ? "이미지 최적화 중..." : isPending ? (schedule ? "저장 중..." : "등록 중...") : (schedule ? "변경사항 저장" : "일정 등록")}
        </button>
      </div>
      {state.error && <p className="form-error admin-form-error" role="alert">{state.error}</p>}
    </form>
  );
}
