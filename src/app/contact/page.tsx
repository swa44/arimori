import { ChevronRight, Info, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const channels = [
  { icon: Phone, label: "전화 문의", value: "010-2582-9969", href: "tel:+821025829969" },
  { icon: Mail, label: "이메일", value: "arimori-ensemble@naver.com", href: "mailto:arimori-ensemble@naver.com" },
];

export const metadata = { title: "공연 문의" };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="CONTACT" title="공연 문의" description="축제, 지역 행사, 찾아가는 공연까지 아리모리와 함께할 무대를 기다립니다." />
      <div className="page-wrap">
        <section className="contact-hero">
          <h2>공간과 관객에 어울리는 무대를 함께 만들어요.</h2>
          <p>행사 일정, 장소, 예상 관객을 알려주시면 공연 구성을 함께 제안해 드립니다.</p>
        </section>

        <div className="contact-list">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a className="contact-link" href={href} key={label}>
              <span className="contact-link__icon"><Icon size={21} /></span>
              <span><strong>{label}</strong><span>{value}</span></span>
              <ChevronRight size={18} color="#99938a" />
            </a>
          ))}
        </div>

        <div className="pending-note">
          <Info size={18} />
          <span>온라인 문의 폼과 개인정보 수집 방식은 운영 정책을 확정한 뒤 추가할 예정입니다.</span>
        </div>
      </div>
    </>
  );
}
