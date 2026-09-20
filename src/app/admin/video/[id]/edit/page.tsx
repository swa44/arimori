import Link from "next/link";
import { notFound } from "next/navigation";
import { updateVideo } from "@/app/admin/actions";
import { VideoForm } from "@/components/admin/VideoForm";
import { createClient } from "@/lib/supabase/server";
import type { VideoRow } from "@/lib/supabase/videos";

export const metadata = { title: "영상 수정" };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("ARIMORI_videos").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Link href="/admin?tab=videos" className="admin-brand">아리모리 <span>관리자</span></Link></header>
      <div className="admin-container admin-container--form">
        <div className="admin-heading"><div><h1>영상 수정</h1><p>영상 정보와 공개 상태를 변경합니다.</p></div></div>
        <VideoForm action={updateVideo} video={data as VideoRow} />
      </div>
    </div>
  );
}
