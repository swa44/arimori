import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BoothStaffLoginForm } from "@/components/event/BoothStaffLoginForm";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function BoothStaffLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const supabase = createServiceClient();
  const { data: program } = await supabase.from("ARIMORI_stamp_programs").select("id, title, slug").eq("slug", slug).maybeSingle();
  if (!program) notFound();
  const { data } = await supabase.from("ARIMORI_stamp_booths").select("id, name").eq("program_id", program.id).not("access_code_hash", "is", null).order("display_order");
  return <div className="event-page page-pattern page-pattern--event"><section className="event-panel">
    <Link className="event-back" href={`/event/stamp/${slug}`}><ArrowLeft size={16} /> 참여 화면</Link>
    <span className="event-symbol"><ShieldCheck size={25} /></span><p className="eyebrow">BOOTH STAFF</p><h1>부스 담당자 로그인</h1><p className="event-lead">{program.title}<br />담당 부스와 전달받은 인증코드를 입력해 주세요.</p>
    {data?.length ? <BoothStaffLoginForm programId={program.id} slug={slug} booths={data} /> : <p className="event-empty">로그인 가능한 부스가 없습니다. 아리모리 관리자에게 문의해 주세요.</p>}
  </section></div>;
}
