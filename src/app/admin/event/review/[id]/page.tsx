import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCampaignForm } from "@/components/admin/EventForms";
import { QrCodeCard } from "@/components/event/QrCodeCard";
import { createServiceClient } from "@/lib/supabase/service";
import type { EventReview, ReviewCampaign } from "@/lib/supabase/events";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { ReviewManagementModal } from "@/components/admin/ReviewManagementModal";
import { ReviewWinnerAnnouncement } from "@/components/admin/ReviewWinnerAnnouncement";

export const dynamic = "force-dynamic";
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
    <section className="admin-section"><div className="admin-section__heading"><div><h2>접수된 후기</h2><p>목록을 열어 검색하거나 공개 상태와 당첨 여부를 관리합니다.</p></div></div><ReviewManagementModal campaignId={id} reviews={reviews} /><ReviewWinnerAnnouncement campaignId={id} announced={campaign.winners_announced} /></section>
    <section className="admin-danger-zone"><div><strong>이벤트 삭제</strong><p>이 이벤트로 접수된 후기를 모두 삭제합니다.</p></div><DeleteEventButton id={id} title={campaign.title} type="review" /></section>
  </div></div>;
}
