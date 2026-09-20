import Link from "next/link";
import { notFound } from "next/navigation";
import { BoothCodeForm, BoothForm, StampProgramForm } from "@/components/admin/EventForms";
import { QrCodeCard } from "@/components/event/QrCodeCard";
import { deleteStampBooth } from "@/app/admin/event-actions";
import { createServiceClient } from "@/lib/supabase/service";
import type { StampBooth, StampParticipant, StampProgram } from "@/lib/supabase/events";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { decryptBoothCode } from "@/lib/booth-auth";
import { StampParticipantModal } from "@/components/admin/StampParticipantModal";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createServiceClient();
  const { data: programData } = await supabase.from("ARIMORI_stamp_programs").select("*").eq("id", id).maybeSingle();
  if (!programData) notFound(); const program = programData as StampProgram;
  const [{ data: boothData }, { data: participantData }, { data: scheduleData }] = await Promise.all([
    supabase.from("ARIMORI_stamp_booths").select("*").eq("program_id", id).order("display_order"),
    supabase.from("ARIMORI_stamp_participants").select("*").eq("program_id", id).order("created_at", { ascending: false }),
    supabase.from("ARIMORI_schedules").select("id, title, start_at").order("start_at", { ascending: false }).limit(200),
  ]);
  const booths = (boothData ?? []) as StampBooth[]; const participants = (participantData ?? []) as StampParticipant[];
  const participantIds = participants.map((participant) => participant.id);
  const { data: stampRecords } = participantIds.length
    ? await supabase.from("ARIMORI_stamp_records").select("participant_id").in("participant_id", participantIds)
    : { data: [] as Array<{ participant_id: string }> };
  const stampCounts = new Map<string, number>();
  for (const record of stampRecords ?? []) stampCounts.set(record.participant_id, (stampCounts.get(record.participant_id) ?? 0) + 1);
  const participantProgress = participants.map((participant) => ({ ...participant, stampCount: stampCounts.get(participant.id) ?? 0 }));
  const origin = process.env.ARIMORI_SITE_URL || "https://ari-mori.com"; const joinUrl = `${origin.replace(/\/$/, "")}/event/stamp/${program.slug}`;
  return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link>
    <div className="admin-heading"><div><h1>{program.title}</h1><p>참여자 {participants.length}명 · 부스 {booths.length}개</p></div></div>
    <QrCodeCard value={joinUrl} fileName={`${program.slug}-join-qr.png`} title="참여 시작 QR" description="행사 입구에 비치해 참여자가 자신의 스탬프 카드를 만들게 하세요." />
    <section className="admin-section"><h2>기본 설정</h2><StampProgramForm program={program} schedules={scheduleData ?? []} /></section>
    <section className="admin-section"><h2>체험 부스</h2><BoothForm programId={id} /><div className="admin-booth-list">{booths.map((booth, index) => <article key={booth.id}><span>{index + 1}</span><div className="admin-booth-info"><strong>{booth.name}</strong>{booth.description && <p>{booth.description}</p>}<BoothCodeForm boothId={booth.id} programId={id} configured={Boolean(booth.access_code_hash)} currentCode={decryptBoothCode(booth.access_code_encrypted)} /></div><Link className="secondary-button" href={`/admin/event/stamp/${id}/scan/${booth.id}`}>관리자 스캔</Link><form action={deleteStampBooth}><input type="hidden" name="id" value={booth.id} /><input type="hidden" name="program_id" value={id} /><button className="text-danger">삭제</button></form></article>)}</div></section>
    <section className="admin-section"><div className="admin-section__heading"><div><h2>참여 현황</h2><p>완료자 중 당첨자를 정한 뒤 참가자 화면에 발표합니다.</p></div></div><StampParticipantModal programId={id} requiredStamps={program.required_stamps} winnersAnnounced={program.winners_announced} participants={participantProgress} /></section>
    <section className="admin-danger-zone"><div><strong>이벤트 삭제</strong><p>이 프로그램의 부스와 참여 기록을 모두 삭제합니다.</p></div><DeleteEventButton id={id} title={program.title} type="stamp" /></section>
  </div></div>;
}
