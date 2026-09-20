import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { QrCodeCard } from "@/components/event/QrCodeCard";
import { RefreshStampButton } from "@/components/event/RefreshStampButton";
import { createServiceClient } from "@/lib/supabase/service";
import type { StampBooth, StampParticipant, StampProgram } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";

export default async function StampCardPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const supabase = createServiceClient();
  const { data: programData } = await supabase.from("ARIMORI_stamp_programs").select("*").eq("slug", slug).maybeSingle();
  if (!programData) notFound();
  const program = programData as StampProgram;
  const { data: participantData } = await supabase.from("ARIMORI_stamp_participants").select("*").eq("program_id", program.id).eq("public_token", token).maybeSingle();
  if (!participantData) notFound();
  const participant = participantData as StampParticipant;
  const [{ data: boothData }, { data: recordData }] = await Promise.all([
    supabase.from("ARIMORI_stamp_booths").select("*").eq("program_id", program.id).order("display_order"),
    supabase.from("ARIMORI_stamp_records").select("booth_id, stamped_at").eq("participant_id", participant.id),
  ]);
  const booths = (boothData ?? []) as StampBooth[];
  const completed = new Set((recordData ?? []).map((item) => item.booth_id));
  const count = Math.min(completed.size, program.required_stamps);
  const origin = process.env.ARIMORI_SITE_URL || "https://ari-mori.com";
  const verifyUrl = `${origin.replace(/\/$/, "")}/event/stamp/verify/${participant.public_token}`;

  return <div className="event-page page-pattern page-pattern--event">
    <section className="event-card-page">
      <p className="eyebrow">MOBILE STAMP</p>
      <h1>{program.title}</h1>
      <p className="event-lead"><strong>{participant.phone.slice(-4)}</strong> 스탬프 카드</p>
      <div className="stamp-progress"><span style={{ width: `${program.required_stamps ? count / program.required_stamps * 100 : 0}%` }} /></div>
      <p className="stamp-progress__text"><strong>{count}</strong> / {program.required_stamps} 완료</p>
      <QrCodeCard value={verifyUrl} fileName={`${program.slug}-stamp-${participant.public_token.slice(0, 8)}.png`} title="내 참여 QR" description="부스 담당자에게 QR을 보여주세요." showValue={false} />
      <RefreshStampButton />
      <div className="stamp-grid">{booths.map((booth, index) => <article className={completed.has(booth.id) ? "is-complete" : ""} key={booth.id}>
        <span>{completed.has(booth.id) ? <Check size={24} /> : index + 1}</span><strong>{booth.name}</strong>{booth.description && <p>{booth.description}</p>}
      </article>)}</div>
      {participant.completed_at && <div className="event-complete-banner"><strong>모든 체험을 완료했어요!</strong><span>{participant.reward_redeemed_at ? "기념품 수령이 완료되었습니다." : "운영 부스에서 이 화면을 보여 주세요."}</span></div>}
    </section>
  </div>;
}
