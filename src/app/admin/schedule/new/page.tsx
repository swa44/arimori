import Link from "next/link";
import { ScheduleForm } from "@/components/admin/ScheduleForm";
import { createSchedule } from "@/app/admin/actions";

export const metadata = { title: "새 일정 등록" };

export default function NewSchedulePage() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Link href="/admin" className="admin-brand">아리모리 <span>관리자</span></Link></header>
      <div className="admin-container admin-container--form">
        <div className="admin-heading"><div><h1>새 공연 등록</h1><p>홈페이지와 달력에 표시할 공연 정보를 입력하세요.</p></div></div>
        <ScheduleForm action={createSchedule} />
      </div>
    </div>
  );
}
