import Link from "next/link";
import { notFound } from "next/navigation";
import { updateNews } from "@/app/admin/actions";
import { NewsForm } from "@/components/admin/NewsForm";
import { createClient } from "@/lib/supabase/server";
import type { NewsRow } from "@/lib/supabase/news";

export const metadata = { title: "소식 수정" };

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("ARIMORI_news").select("*").eq("id", id).single();
  if (!data) notFound();

  return <div className="admin-shell">
    <header className="admin-topbar"><Link href="/admin?tab=news" className="admin-brand">아리모리 <span>관리자</span></Link></header>
    <div className="admin-container admin-container--form">
      <div className="admin-heading"><div><h1>소식 수정</h1><p>뱃지 문구와 제목, 내용을 변경합니다.</p></div></div>
      <NewsForm action={updateNews} news={data as NewsRow} />
    </div>
  </div>;
}
