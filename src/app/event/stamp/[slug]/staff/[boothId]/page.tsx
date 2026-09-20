import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StampScanner } from "@/components/admin/StampScanner";
import { hasBoothSession } from "@/lib/booth-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function BoothStaffScannerPage({ params }: { params: Promise<{ slug: string; boothId: string }> }) {
  const { slug, boothId } = await params;
  if (!await hasBoothSession(boothId)) redirect(`/event/stamp/${slug}/staff`);
  const { data } = await createServiceClient().from("ARIMORI_stamp_booths").select("name, program_id, ARIMORI_stamp_programs(title, slug)").eq("id", boothId).maybeSingle();
  const program = data?.ARIMORI_stamp_programs as unknown as { title: string; slug: string } | null;
  if (!data || program?.slug !== slug) notFound();
  return <div className="event-page scanner-page page-pattern page-pattern--event"><section className="event-panel">
    <Link className="event-back" href={`/event/stamp/${slug}/staff`}><ArrowLeft size={16} /> 다른 부스 로그인</Link><p className="eyebrow">BOOTH SCANNER</p><h1>{data.name}</h1><p>{program.title} 참여자의 QR을 카메라 안에 맞춰 주세요.</p><StampScanner boothId={boothId} staffMode />
  </section></div>;
}
