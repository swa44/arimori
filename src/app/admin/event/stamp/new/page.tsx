import Link from "next/link";
import { StampProgramForm } from "@/components/admin/EventForms";
import { createServiceClient } from "@/lib/supabase/service";
export const metadata = { title: "스탬프 프로그램 만들기" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await createServiceClient().from("ARIMORI_schedules").select("id, title, start_at").order("start_at", { ascending: false }).limit(200);
  return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link><div className="admin-heading"><div><h1>새 스탬프 프로그램</h1><p>공연 연결, 기간과 필요한 스탬프 수를 정해 주세요.</p></div></div><StampProgramForm schedules={data ?? []} /></div></div>;
}
