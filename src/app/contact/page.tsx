import { ChevronRight, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InquiryForm } from "@/components/contact/InquiryForm";

const channels = [
  {
    icon: Phone,
    label: "전화 문의",
    value: "010-2582-9969",
    href: "tel:+821025829969",
  },
  {
    icon: Mail,
    label: "이메일",
    value: "arimori-ensemble@naver.com",
    href: "mailto:arimori-ensemble@naver.com",
  },
];

export const metadata = { title: "공연 문의" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="CONTACT"
        title="공연 문의"
        description={
          <span className="contact-header-description">
            축제, 지역 행사, 찾아가는 공연까지
            <br />
            <span className="contact-header-description__second">공간과 관객에 어울리는 무대를 준비합니다.</span>
          </span>
        }
      />
      <div className="page-wrap">
        <InquiryForm />

        <div className="contact-list">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a className="contact-link" href={href} key={label}>
              <span className="contact-link__icon">
                <Icon size={21} />
              </span>
              <span>
                <strong>{label}</strong>
                <span>{value}</span>
              </span>
              <ChevronRight size={18} color="#99938a" />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
