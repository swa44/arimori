import Link from "next/link";
import { notFound } from "next/navigation";
import { StampScanner } from "@/components/admin/StampScanner";
import { createServiceClient } from "@/lib/supabase/service";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string; boothId: string }> }) {
  const { id, boothId } = await params;
  const { data } = await createServiceClient().from("ARIMORI_stamp_booths").select("name, ARIMORI_stamp_programs(title)").eq("id", boothId).eq("program_id", id).maybeSingle();
  if (!data) notFound();
  const relation = data.ARIMORI_stamp_programs as unknown as { title: string } | null;
  return <div className="admin-shell scanner-page"><div className="admin-container admin-editor"><Link href={`/admin/event/stamp/${id}`} className="admin-back">← 프로그램 관리</Link><p className="eyebrow">STAMP SCANNER</p><h1>{data.name}</h1><p>{relation?.title} 참여자의 QR을 카메라 안에 맞춰 주세요.</p><StampScanner boothId={boothId} /></div></div>;
}
