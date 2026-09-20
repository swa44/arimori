import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { InquiryStatusForm } from "@/components/admin/InquiryStatusForm";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "공연 문의 상세 | 관리자" };

const smsLabel: Record<string, string> = {
  pending: "발송 대기",
  sent: "발송 완료",
  failed: "발송 실패",
  not_configured: "수신번호 미설정",
};

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: inquiry } = await supabase.from("ARIMORI_inquiries").select("*").eq("id", id).maybeSingle();
  if (!inquiry) notFound();

  const createdAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(inquiry.created_at));

  return <div className="admin-shell">
    <header className="admin-topbar"><Link href="/" className="admin-brand">아리모리 <span>관리자</span></Link><LogoutButton /></header>
    <main className="admin-container admin-container--form">
      <Link className="admin-back" href="/admin?tab=inquiries"><ArrowLeft size={16} /> 공연문의 목록</Link>
      <div className="admin-heading inquiry-detail-heading"><div><p>{createdAt} 접수</p><h1>{inquiry.name}님의 공연 문의</h1></div></div>
      <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
      <section className="inquiry-detail-card">
        <dl>
          <div><dt>이름</dt><dd>{inquiry.name}</dd></div>
          <div><dt>연락처</dt><dd><a href={`tel:${inquiry.phone}`}><Phone size={15} />{inquiry.phone}</a></dd></div>
          <div><dt>이메일</dt><dd><a href={`mailto:${inquiry.email}`}><Mail size={15} />{inquiry.email}</a></dd></div>
          <div className="inquiry-detail-message"><dt>문의 내용</dt><dd>{inquiry.message}</dd></div>
          <div><dt>개인정보 동의</dt><dd>{inquiry.privacy_agreed ? "동의" : "미동의"}</dd></div>
          <div><dt>알림 문자</dt><dd>{smsLabel[inquiry.sms_status] ?? inquiry.sms_status}{inquiry.sms_sent_at ? ` · ${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(inquiry.sms_sent_at))}` : ""}</dd></div>
          {inquiry.sms_error && <div><dt>발송 오류</dt><dd className="form-error">{inquiry.sms_error}</dd></div>}
        </dl>
      </section>
    </main>
  </div>;
}
