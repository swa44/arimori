import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { EventReviewForm } from "@/components/event/EventReviewForm";
import { createServiceClient } from "@/lib/supabase/service";
import type { ReviewCampaign } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";

export default async function EventReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("ARIMORI_review_campaigns").select("*").eq("access_token", token).single();
  if (!data) notFound();
  const campaign = data as ReviewCampaign;
  return <div className="event-page"><div className="event-panel">
    <Link className="event-back" href="/event"><ArrowLeft size={16} /> 이벤트 목록</Link>
    <span className="event-symbol"><MessageCircle size={25} /></span>
    <p className="eyebrow">AUDIENCE REVIEW</p><h1>{campaign.title}</h1><p className="event-lead">오늘의 공연은 어떠셨나요? 기억에 남은 순간을 들려주세요.</p>
    <EventReviewForm accessToken={campaign.access_token} />
  </div></div>;
}
