import Link from "next/link";
import { createVideo } from "@/app/admin/actions";
import { VideoForm } from "@/components/admin/VideoForm";

export const metadata = { title: "새 영상 등록" };

export default function NewVideoPage() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Link href="/admin?tab=videos" className="admin-brand">아리모리 <span>관리자</span></Link></header>
      <div className="admin-container admin-container--form">
        <div className="admin-heading"><div><h1>새 영상 등록</h1><p>유튜브 영상 주소를 입력하면 썸네일과 재생 화면이 자동으로 연결됩니다.</p></div></div>
        <VideoForm action={createVideo} />
      </div>
    </div>
  );
}
