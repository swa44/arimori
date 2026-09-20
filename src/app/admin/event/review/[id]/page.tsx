import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCampaignForm } from "@/components/admin/EventForms";
import { QrCodeCard } from "@/components/event/QrCodeCard";
import { updateReviewState } from "@/app/admin/event-actions";
import { createServiceClient } from "@/lib/supabase/service";
import type { EventReview, ReviewCampaign } from "@/lib/supabase/events";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";

export const dynamic = "force-dynamic";
const label = { pending: "승인 대기", approved: "공개 승인", rejected: "비공개" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createServiceClient();
  const { data: campaignData } = await supabase.from("ARIMORI_review_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaignData) notFound(); const campaign = campaignData as ReviewCampaign;
  const { data } = await supabase.from("ARIMORI_event_reviews").select("*").eq("campaign_id", id).order("created_at", { ascending: false });
  const reviews = (data ?? []) as EventReview[];
  const origin = process.env.ARIMORI_SITE_URL || "https://ari-mori.com"; const reviewUrl = `${origin.replace(/\/$/, "")}/event/review/${campaign.access_token}`;
  return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link><div className="admin-heading"><div><h1>{campaign.title}</h1><p>접수 {reviews.length}개 · 공개 승인 {reviews.filter((item) => item.status === "approved").length}개</p></div></div>
    <QrCodeCard value={reviewUrl} fileName={`review-${campaign.access_token.slice(0, 8)}.png`} title="후기 참여 QR" description="공연 종료 후 화면이나 안내물에 사용하세요." />
    <section className="admin-section"><h2>기본 설정</h2><ReviewCampaignForm campaign={campaign} /></section>
    <section className="admin-section"><h2>접수된 후기</h2><div className="admin-review-list">{reviews.length === 0 && <p className="admin-empty">아직 접수된 후기가 없습니다.</p>}{reviews.map((review) => <article key={review.id}>
      <div className="admin-review-list__meta"><strong>{review.display_name}</strong><span>{review.phone}</span><em className={`review-state is-${review.status}`}>{label[review.status]}</em>{review.is_winner && <em className="review-winner">당첨</em>}</div><p>{review.content}</p><small>{review.public_agreed ? "홈페이지 공개 동의" : "홈페이지 공개 미동의"}</small>
      <div className="admin-review-list__actions">{review.public_agreed && <form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={id} /><button name="action" value="approved">공개 승인</button></form>}<form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={id} /><button name="action" value="rejected">비공개</button></form><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={id} /><input type="hidden" name="next_winner" value={review.is_winner ? "" : "on"} /><button name="action" value="winner">{review.is_winner ? "당첨 해제" : "당첨 표시"}</button></form><form action={updateReviewState}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="campaign_id" value={id} /><button className="text-danger" name="action" value="delete">삭제</button></form></div>
    </article>)}</div></section>
    <section className="admin-danger-zone"><div><strong>이벤트 삭제</strong><p>이 이벤트로 접수된 후기를 모두 삭제합니다.</p></div><DeleteEventButton id={id} title={campaign.title} type="review" /></section>
  </div></div>;
}
