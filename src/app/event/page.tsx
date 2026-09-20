import Link from "next/link";
import { ChevronRight, MessageCircle, Stamp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getActiveEventPrograms } from "@/lib/supabase/events";

export const metadata = { title: "이벤트" };
export const dynamic = "force-dynamic";

export default async function EventPage() {
  const { stamps, reviews } = await getActiveEventPrograms();
  return <div className="page-pattern page-pattern--event">
    <PageHeader eyebrow="JOIN ARIMORI" title="이벤트 참여" description="아리모리의 공연과 체험을 함께 즐기고 기록해 보세요." />
    <div className="page-wrap event-home">
      <section><div className="event-section-title"><Stamp size={20} /><div><h2>모바일 스탬프</h2><p>부스를 체험하고 나만의 스탬프를 모아보세요.</p></div></div>
        <div className="event-link-list">{stamps.map((item) => <Link href={`/event/stamp/${item.slug}`} key={item.id}><div><strong>{item.title}</strong><span>{item.description || "스탬프 프로그램에 참여해 보세요."}</span></div><ChevronRight size={18} /></Link>)}{!stamps.length && <p className="event-empty">현재 진행 중인 스탬프 프로그램이 없습니다.</p>}</div>
      </section>
      <section><div className="event-section-title"><MessageCircle size={20} /><div><h2>공연 후기</h2><p>현장에서 안내받은 QR로 참여할 수 있습니다.</p></div></div>
        <div className="event-link-list">{reviews.map((item) => <Link href={`/event/review/${item.access_token}`} key={item.id}><div><strong>{item.title}</strong><span>후기를 남기고 추첨에 참여하세요.</span></div><ChevronRight size={18} /></Link>)}{!reviews.length && <p className="event-empty">현재 참여 가능한 공연 후기가 없습니다.</p>}</div>
      </section>
    </div>
  </div>;
}
