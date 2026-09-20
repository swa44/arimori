import Link from "next/link";
import { createNews } from "@/app/admin/actions";
import { NewsForm } from "@/components/admin/NewsForm";

export const metadata = { title: "새 소식 등록" };

export default function NewNewsPage() {
  return <div className="admin-shell">
    <header className="admin-topbar"><Link href="/admin?tab=news" className="admin-brand">아리모리 <span>관리자</span></Link></header>
    <div className="admin-container admin-container--form">
      <div className="admin-heading"><div><h1>새 소식 등록</h1><p>홈 화면과 전체 소식 모달에 표시할 내용을 입력합니다.</p></div></div>
      <NewsForm action={createNews} />
    </div>
  </div>;
}
