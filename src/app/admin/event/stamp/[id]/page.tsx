import Link from "next/link";
import { notFound } from "next/navigation";
import { BoothForm, StampProgramForm } from "@/components/admin/EventForms";
import { QrCodeCard } from "@/components/event/QrCodeCard";
import { deleteStampBooth, redeemStampReward } from "@/app/admin/event-actions";
import { createServiceClient } from "@/lib/supabase/service";
import type { StampBooth, StampParticipant, StampProgram } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createServiceClient();
  const { data: programData } = await supabase.from("ARIMORI_stamp_programs").select("*").eq("id", id).maybeSingle();
  if (!programData) notFound(); const program = programData as StampProgram;
  const [{ data: boothData }, { data: participantData }] = await Promise.all([
    supabase.from("ARIMORI_stamp_booths").select("*").eq("program_id", id).order("display_order"),
    supabase.from("ARIMORI_stamp_participants").select("*").eq("program_id", id).order("created_at", { ascending: false }),
  ]);
  const booths = (boothData ?? []) as StampBooth[]; const participants = (participantData ?? []) as StampParticipant[];
  const origin = process.env.ARIMORI_SITE_URL || "https://arimori.vercel.app"; const joinUrl = `${origin.replace(/\/$/, "")}/event/stamp/${program.slug}`;
  return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link>
    <div className="admin-heading"><div><h1>{program.title}</h1><p>참여자 {participants.length}명 · 부스 {booths.length}개</p></div></div>
    <QrCodeCard value={joinUrl} fileName={`${program.slug}-join-qr.png`} title="참여 시작 QR" description="행사 입구에 비치해 참여자가 자신의 스탬프 카드를 만들게 하세요." />
    <section className="admin-section"><h2>기본 설정</h2><StampProgramForm program={program} /></section>
    <section className="admin-section"><h2>체험 부스</h2><BoothForm programId={id} /><div className="admin-booth-list">{booths.map((booth, index) => <article key={booth.id}><span>{index + 1}</span><div><strong>{booth.name}</strong>{booth.description && <p>{booth.description}</p>}</div><Link className="secondary-button" href={`/admin/event/stamp/${id}/scan/${booth.id}`}>스캔 화면</Link><form action={deleteStampBooth}><input type="hidden" name="id" value={booth.id} /><input type="hidden" name="program_id" value={id} /><button className="text-danger">삭제</button></form></article>)}</div></section>
    <section className="admin-section"><h2>참여 현황</h2><div className="admin-participant-list">{participants.length === 0 && <p className="admin-empty">아직 참여자가 없습니다.</p>}{participants.map((item) => <article key={item.id}><div><strong>{item.display_name}</strong><span>{item.phone} · {item.completed_at ? "스탬프 완료" : "참여 중"}</span></div>{item.completed_at && !item.reward_redeemed_at && <form action={redeemStampReward}><input type="hidden" name="participant_id" value={item.id} /><input type="hidden" name="program_id" value={id} /><button className="secondary-button">기념품 수령 처리</button></form>}{item.reward_redeemed_at && <span className="admin-done">수령 완료</span>}</article>)}</div></section>
  </div></div>;
}
