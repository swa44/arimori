import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Stamp } from "lucide-react";
import { StampJoinForm } from "@/components/event/StampJoinForm";
import { createServiceClient } from "@/lib/supabase/service";
import type { StampProgram } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";

export default async function StampJoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("ARIMORI_stamp_programs").select("*").eq("slug", slug).single();
  if (!data) notFound();
  const program = data as StampProgram;
  return <div className="event-page"><div className="event-panel">
    <Link className="event-back" href="/event"><ArrowLeft size={16} /> 이벤트 목록</Link>
    <span className="event-symbol"><Stamp size={25} /></span>
    <p className="eyebrow">MOBILE STAMP</p><h1>{program.title}</h1><p className="event-lead">{program.description || "체험 부스를 방문하고 모바일 스탬프를 모아보세요."}</p>
    <div className="event-progress-note"><strong>{program.required_stamps}개의 스탬프</strong><span>완주에 필요한 스탬프 수</span></div>
    <StampJoinForm programId={program.id} slug={program.slug} />
    <Link className="booth-staff-link" href={`/event/stamp/${program.slug}/staff`}><ShieldCheck size={16} /> 부스 담당자 로그인</Link>
  </div></div>;
}
