import Link from "next/link";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { schedules } from "@/data/content";

export const metadata = { title: "관리자" };

export default function AdminPage() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand">아리모리 <span>관리자</span></Link>
        <Link href="/admin/login" className="secondary-button"><LogOut size={15} /> 나가기</Link>
      </header>
      <div className="admin-container">
        <div className="admin-heading">
          <div><h1>공연 일정</h1><p>등록된 공연 {schedules.length}개 · UI 미리보기</p></div>
          <button className="primary-button" disabled><Plus size={16} /> 새 일정</button>
        </div>
        <section className="admin-card">
          {schedules.map((item) => (
            <article className="admin-event" key={item.id}>
              <div className="admin-event__date">{item.date.slice(5).replace("-", ". ")}</div>
              <div><h2>{item.title}</h2><p>{item.time} · {item.location}</p></div>
              <div className="admin-actions">
                <button aria-label={`${item.title} 수정`} disabled><Pencil size={16} /></button>
                <button aria-label={`${item.title} 삭제`} disabled><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
