import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { DeleteScheduleButton } from "@/components/admin/DeleteScheduleButton";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/lib/supabase/schedules";

export const metadata = { title: "관리자" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("ARIMORI_schedules").select("*").order("start_at", { ascending: false });
  const schedules = (data ?? []) as ScheduleRow[];

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand">아리모리 <span>관리자</span></Link>
        <LogoutButton />
      </header>
      <div className="admin-container">
        <div className="admin-heading">
          <div><h1>공연 일정</h1><p>등록된 공연 {schedules.length}개</p></div>
          <Link href="/admin/schedule/new" className="primary-button"><Plus size={16} /> 새 일정</Link>
        </div>
        <section className="admin-card">
          {schedules.length === 0 && <div className="admin-empty">등록된 공연이 없습니다. 첫 일정을 추가해 보세요.</div>}
          {schedules.map((item) => (
            <article className="admin-event" key={item.id}>
              <div className="admin-event__date">{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" }).format(new Date(item.start_at))}</div>
              <div><h2>{item.title}</h2><p>{item.location} · {item.is_public ? "공개" : "비공개"}</p></div>
              <div className="admin-actions">
                <Link href={`/admin/schedule/${item.id}/edit`} aria-label={`${item.title} 수정`}><Pencil size={16} /></Link>
                <DeleteScheduleButton id={item.id} posterPath={item.poster_path} title={item.title} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
