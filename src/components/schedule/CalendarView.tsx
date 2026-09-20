"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Schedule } from "@/data/content";
import { ScheduleDetailSheet } from "@/components/schedule/ScheduleDetailSheet";

function formatScheduleCardDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(new Date(year, month - 1, day));
  return `${month}월 ${day}일(${weekday})`;
}

export function CalendarView({ schedules, today }: { schedules: Schedule[]; today: string }) {
  const initial = new Date(`${today}T00:00:00`);
  const [currentMonth, setCurrentMonth] = useState(initial);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const monthItems = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}-`;
    return schedules.filter((item) => item.date.startsWith(prefix)).sort((a, b) => {
      const aPast = a.date < today;
      const bPast = b.date < today;
      if (aPast !== bPast) return aPast ? 1 : -1;
      const comparison = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return aPast ? -comparison : comparison;
    });
  }, [currentMonth, schedules, today]);

  function changeMonth(offset: number) {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  }

  return <>
    <section className="schedule-list" aria-label={`${currentMonth.getMonth() + 1}월 공연 일정`}>
      <div className="calendar-toolbar"><div>
        <p className="eyebrow calendar-toolbar__year">{currentMonth.getFullYear()}</p>
        <div className="calendar-toolbar__title-row">
          <h1>{currentMonth.getMonth() + 1}월 공연 일정</h1>
          <div className="calendar-toolbar__controls"><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="이전 달"><ChevronLeft size={20} /></button><button className="icon-button" onClick={() => changeMonth(1)} aria-label="다음 달"><ChevronRight size={20} /></button></div>
        </div>
        <p className="calendar-toolbar__description">아래의 일정카드를 눌러 세부 공연 정보를 확인하세요.</p>
      </div></div>
      <div className="schedule-list__items" aria-live="polite">
        {monthItems.length ? monthItems.map((item) => <button className={`schedule-item ${item.date < today ? "is-past" : ""} ${item.date === today ? "is-today" : ""}`} key={item.id} onClick={() => setSelectedSchedule(item)}>
          {item.posterUrl && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="schedule-item__poster" src={item.posterUrl} alt="" aria-hidden="true" loading="lazy" />
          </>}
          <span className={`schedule-item__status schedule-item__status--top ${item.date < today ? "is-ended" : item.date === today ? "is-live" : "is-upcoming"}`}>{item.date < today ? "공연 종료" : item.date === today ? "당일 공연" : "공연 예정"}</span>
          <div className="schedule-item__content">
            <h3>{item.title}</h3>
            <p>{formatScheduleCardDate(item.date)} {item.time} · {item.location}</p>
          </div>
        </button>) : <div className="empty-agenda"><CalendarDays size={25} /><span>이 달에는 예정된 공연이 없습니다.</span></div>}
      </div>
    </section>
    {selectedSchedule && <ScheduleDetailSheet schedule={selectedSchedule} today={today} onClose={() => setSelectedSchedule(null)} />}
  </>;
}
