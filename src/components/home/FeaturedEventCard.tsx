/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import type { Schedule } from "@/data/content";
import { ScheduleDetailSheet } from "@/components/schedule/ScheduleDetailSheet";

function formatCardDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(new Date(year, month - 1, day));
  return `${month}월 ${day}일(${weekday})`;
}

export function FeaturedEventCard({ schedule, today }: { schedule: Schedule | null; today: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const posterUrl = schedule?.posterUrls?.[0] ?? schedule?.posterUrl;

  return <>
    <article
      className={`hero__event-card${schedule ? " is-clickable" : ""}`}
      role={schedule ? "button" : undefined}
      tabIndex={schedule ? 0 : undefined}
      onClick={() => { if (schedule) setIsOpen(true); }}
      onKeyDown={(event) => {
        if (schedule && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          setIsOpen(true);
        }
      }}
    >
      <div className={`hero__poster-thumb${posterUrl ? " has-image" : ""}`}>
        {posterUrl ? <img src={posterUrl} alt={`${schedule?.title ?? "다가오는 공연"} 포스터`} /> : <ImageIcon size={22} aria-hidden="true" />}
      </div>
      <div>
        <span className="tag">다가오는 공연</span>
        <h2>{schedule?.title ?? "새로운 공연을 준비하고 있어요"}</h2>
        <p>{schedule ? <>{formatCardDate(schedule.date)} {schedule.time}<br /><span>{schedule.location}</span></> : "공연 소식을 곧 전해드릴게요"}</p>
      </div>
      <span className="circle-button" aria-hidden="true"><ChevronRight size={21} strokeWidth={1.9} /></span>
    </article>
    {schedule && isOpen && <ScheduleDetailSheet schedule={schedule} today={today} onClose={() => setIsOpen(false)} />}
  </>;
}
