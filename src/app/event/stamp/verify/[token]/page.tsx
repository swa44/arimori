import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function StampVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("ARIMORI_stamp_participants").select("phone, completed_at").eq("public_token", token).maybeSingle();
  if (!data) notFound();
  return <div className="event-page page-pattern page-pattern--event"><section className="event-card-page event-verify">
    <p className="eyebrow">ARIMORI EVENT</p><h1>{data.phone.slice(-4)} 참여 QR</h1>
    <p>부스 담당자가 관리자 스캔 화면으로 확인하면 스탬프가 기록됩니다.</p>
    {data.completed_at && <div className="event-complete-banner"><strong>체험 완료</strong><span>모든 필수 스탬프를 모았습니다.</span></div>}
  </section></div>;
}
