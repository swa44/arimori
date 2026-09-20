"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, MapPin, Navigation, Ticket, X } from "lucide-react";
import type { Schedule } from "@/data/content";

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date(year, month - 1, day));
}

export function ScheduleDetailSheet({ schedule, today, onClose }: { schedule: Schedule; today: string; onClose: () => void }) {
  const posterUrls = schedule.posterUrls?.length ? schedule.posterUrls : schedule.posterUrl ? [schedule.posterUrl] : [];
  const [showMapChooser, setShowMapChooser] = useState(false);
  const [isPosterLoading, setIsPosterLoading] = useState(Boolean(posterUrls.length));
  const [posterLoadFailed, setPosterLoadFailed] = useState(false);
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const posterTouchStartX = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function changePoster(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= posterUrls.length || nextIndex === activePosterIndex) return;
    setPosterLoadFailed(false);
    setIsPosterLoading(true);
    setActivePosterIndex(nextIndex);
  }

  function openMapApp(service: "naver" | "kakao" | "tmap") {
    const query = encodeURIComponent(schedule.mapQuery ?? schedule.location);
    if (service === "naver") {
      window.location.href = `nmap://search?query=${query}&appname=${encodeURIComponent(window.location.origin)}`;
    } else if (service === "kakao") {
      window.location.href = `kakaomap://search?q=${query}`;
    } else {
      window.location.href = `tmap://search?name=${query}`;
    }
  }

  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`detail-sheet ${isPosterLoading ? "is-loading" : ""}`} role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title" aria-busy={isPosterLoading}>
      <div className="detail-sheet__handle" />
      {posterUrls.length ? <div
        className="detail-sheet__gallery"
        onTouchStart={(event) => { posterTouchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          const startX = posterTouchStartX.current;
          const endX = event.changedTouches[0]?.clientX;
          posterTouchStartX.current = null;
          if (startX == null || endX == null || Math.abs(startX - endX) < 45) return;
          changePoster(activePosterIndex + (startX > endX ? 1 : -1));
        }}
      >
        <div className={`detail-sheet__visual${posterLoadFailed ? "" : " has-image"}`}>
          {!posterLoadFailed && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={posterUrls[activePosterIndex]} src={posterUrls[activePosterIndex]} alt={`${schedule.title} 포스터 ${activePosterIndex + 1}`} onLoad={() => setIsPosterLoading(false)} onError={() => { setPosterLoadFailed(true); setIsPosterLoading(false); }} />
          </>}
        </div>
        {posterUrls.length > 1 && <>
          <button className="detail-sheet__gallery-arrow is-prev" type="button" disabled={activePosterIndex === 0} onClick={() => changePoster(activePosterIndex - 1)} aria-label="이전 포스터"><ChevronLeft size={22} /></button>
          <button className="detail-sheet__gallery-arrow is-next" type="button" disabled={activePosterIndex === posterUrls.length - 1} onClick={() => changePoster(activePosterIndex + 1)} aria-label="다음 포스터"><ChevronRight size={22} /></button>
          <div className="detail-sheet__gallery-count" aria-live="polite">{activePosterIndex + 1} / {posterUrls.length}</div>
          <div className="detail-sheet__gallery-dots" aria-hidden="true">{posterUrls.map((url, index) => <span className={index === activePosterIndex ? "is-active" : ""} key={url} />)}</div>
        </>}
      </div> : <div className="detail-sheet__visual" aria-label="공연 포스터 이미지 자리" />}

      <div className="detail-sheet__content">
        <span className={`schedule-item__status detail-sheet__status ${schedule.date < today ? "is-ended" : schedule.date === today ? "is-live" : "is-upcoming"}`}>{schedule.date < today ? "공연 종료" : schedule.date === today ? "당일 공연" : "공연 예정"}</span>
        <div className="detail-sheet__title-row"><h2 id="schedule-detail-title">{schedule.title}</h2></div>
        <p className="detail-row"><Clock3 size={17} /><span>{formatKoreanDate(schedule.date)} · {schedule.time}</span></p>
        <p className="detail-row"><MapPin size={17} /><span>{schedule.location}</span></p>
        <p className="detail-description">{schedule.description}</p>
        <div className={`detail-actions ${schedule.bookingType !== "reservation" ? "has-notice" : ""}`}>
          <button className="secondary-button" type="button" onClick={() => setShowMapChooser(true)}><Navigation size={16} /> 길찾기</button>
          {schedule.bookingType === "reservation" && schedule.bookingUrl ? <a className="primary-button" href={schedule.bookingUrl} target="_blank" rel="noreferrer"><Ticket size={16} /> 공연 예매</a>
            : schedule.bookingType === "onsite" ? <p className="booking-notice">해당 공연은 현장 발권만 가능합니다.</p>
              : schedule.bookingType === "free" ? <p className="booking-notice">해당 공연은 별도 예매를 받지 않습니다.</p>
                : <p className="booking-notice">공연 예매 링크를 준비하고 있습니다.</p>}
        </div>
      </div>
      <button className="secondary-button detail-sheet__bottom-close" type="button" onClick={onClose}>닫기</button>
      {isPosterLoading && <div className="detail-sheet__loading" role="status" aria-live="polite"><span className="detail-sheet__spinner" aria-hidden="true" /><span>공연 정보를 불러오는 중입니다.</span></div>}
    </section>

    {showMapChooser && <div className="map-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowMapChooser(false)}>
      <section className="map-chooser map-modal" role="dialog" aria-modal="true" aria-label="지도 앱 선택">
        <div className="map-chooser__heading"><div><strong>지도 앱 선택</strong><span>{schedule.mapQuery ?? schedule.location}</span></div><button type="button" onClick={() => setShowMapChooser(false)} aria-label="지도 앱 선택 닫기"><X size={17} /></button></div>
        <div className="map-chooser__options"><button type="button" onClick={() => openMapApp("naver")}>네이버 지도</button><button type="button" onClick={() => openMapApp("kakao")}>카카오맵</button><button type="button" onClick={() => openMapApp("tmap")}>TMAP</button></div>
      </section>
    </div>}
  </div>;
}
