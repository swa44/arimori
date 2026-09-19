"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Navigation, Ticket, X } from "lucide-react";
import type { Schedule } from "@/data/content";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(date);
}

export function CalendarView({ schedules }: { schedules: Schedule[] }) {
  const initial = new Date(2026, 8, 1);
  const [currentMonth, setCurrentMonth] = useState(initial);
  const [selectedDate, setSelectedDate] = useState("2026-09-20");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedSchedule ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedSchedule]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: lastDate }, (_, index) => index + 1)];
  }, [currentMonth]);

  const selectedItems = schedules.filter((item) => item.date === selectedDate);
  const today = dateKey(new Date());

  function changeMonth(offset: number) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(next);
    setSelectedDate(dateKey(next));
  }

  return (
    <>
      <section className="calendar-card" aria-label="공연 일정 달력">
        <div className="calendar-toolbar">
          <button className="icon-button" onClick={() => changeMonth(-1)} aria-label="이전 달"><ChevronLeft size={20} /></button>
          <h2>{currentMonth.getFullYear()}. {String(currentMonth.getMonth() + 1).padStart(2, "0")}</h2>
          <button className="icon-button" onClick={() => changeMonth(1)} aria-label="다음 달"><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-grid">
          {weekDays.map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
          {days.map((day, index) => {
            if (!day) return <div className="calendar-day is-empty" key={`empty-${index}`} />;
            const value = dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
            const hasSchedule = schedules.some((item) => item.date === value);
            return (
              <button
                key={value}
                className={`calendar-day ${selectedDate === value ? "is-selected" : ""} ${today === value ? "is-today" : ""}`}
                onClick={() => setSelectedDate(value)}
                aria-label={`${formatKoreanDate(value)}${hasSchedule ? ", 공연 있음" : ""}`}
                aria-pressed={selectedDate === value}
              >
                <span>{day}</span>
                {hasSchedule && <span className="calendar-day__dot" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="day-agenda" aria-live="polite">
        <div className="day-agenda__heading">
          <strong>{formatKoreanDate(selectedDate)}</strong>
          <span>{selectedItems.length ? `${selectedItems.length}개의 공연` : "공연 없음"}</span>
        </div>
        {selectedItems.length ? selectedItems.map((item) => (
          <button className={`schedule-item tone-${item.tone}`} key={item.id} onClick={() => setSelectedSchedule(item)}>
            <span className="schedule-item__bar" />
            <span><h3>{item.title}</h3><p>{item.time} · {item.location}</p></span>
            <ChevronRight size={18} color="#99938a" />
          </button>
        )) : (
          <div className="empty-agenda"><CalendarDays size={25} /><span>이 날짜에는 예정된 공연이 없습니다.</span></div>
        )}
      </section>

      {selectedSchedule && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedSchedule(null)}>
          <section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="schedule-title">
            <div className="detail-sheet__handle" />
            <button className="icon-button detail-sheet__close" onClick={() => setSelectedSchedule(null)} aria-label="상세 닫기"><X size={19} /></button>
            <div className="detail-sheet__visual" aria-label="공연 포스터 이미지 자리" />
            <div className="detail-sheet__content">
              <span className="tag tag--teal">{selectedSchedule.category}</span>
              <h2 id="schedule-title">{selectedSchedule.title}</h2>
              <p className="detail-row"><Clock3 size={17} /><span>{formatKoreanDate(selectedSchedule.date)} · {selectedSchedule.time}</span></p>
              <p className="detail-row"><MapPin size={17} /><span>{selectedSchedule.location}<br />{selectedSchedule.address}</span></p>
              <p className="detail-description">{selectedSchedule.description}</p>
              <div className="detail-actions">
                <button className="secondary-button"><Navigation size={16} /> 길찾기</button>
                <button className="primary-button"><Ticket size={16} /> 공연 안내</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
