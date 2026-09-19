import Link from "next/link";
import { notFound } from "next/navigation";
import { updateSchedule } from "@/app/admin/actions";
import { ScheduleForm } from "@/components/admin/ScheduleForm";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/lib/supabase/schedules";

export const metadata = { title: "일정 수정" };

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("ARIMORI_schedules").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Link href="/admin" className="admin-brand">아리모리 <span>관리자</span></Link></header>
      <div className="admin-container admin-container--form">
        <div className="admin-heading"><div><h1>공연 수정</h1><p>등록된 공연 정보와 공개 상태를 변경합니다.</p></div></div>
        <ScheduleForm action={updateSchedule} schedule={data as ScheduleRow} />
      </div>
    </div>
  );
}
