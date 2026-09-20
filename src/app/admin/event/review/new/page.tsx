import Link from "next/link";
import { ReviewCampaignForm } from "@/components/admin/EventForms";
import { createServiceClient } from "@/lib/supabase/service";
export const metadata = { title: "후기 이벤트 만들기" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await createServiceClient().from("ARIMORI_schedules").select("id, title, start_at").order("start_at", { ascending: false }).limit(200);
  return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link><div className="admin-heading"><div><h1>새 후기 이벤트</h1><p>공연과 연결하면 승인한 후기가 공연 상세에 표시됩니다.</p></div></div><ReviewCampaignForm schedules={data ?? []} /></div></div>;
}
