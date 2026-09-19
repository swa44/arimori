import { MapPinned, Sparkles, Theater } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const performances = [
  { icon: Theater, title: "기획공연", text: "아리모리만의 이야기와 색을 담아 계절과 공간에 어울리는 무대를 만듭니다." },
  { icon: MapPinned, title: "찾아가는 문화예술", text: "마을, 학교, 복지시설 등 관객이 있는 곳으로 찾아가 가까이에서 호흡합니다." },
  { icon: Sparkles, title: "축제·행사 협업", text: "행사의 성격과 관객에 맞춰 전통의 흥을 친근하고 생동감 있게 구성합니다." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="ABOUT ARIMORI" title="우리의 소리로, 함께 잇는 시간" description="아리모리는 전통예술의 깊이를 오늘의 감각으로 풀어내 지역과 사람을 연결하는 공연팀입니다." />
      <div className="page-wrap">
        <section className="statement-card">
          <blockquote>전통은 멀리 있는 것이 아니라, 오늘 우리 곁에서 다시 살아나는 이야기입니다.</blockquote>
          <p>익숙한 장단에 새로운 호흡을 더하고, 누구나 편안하게 즐길 수 있는 무대를 만들어갑니다.</p>
        </section>

        <section>
          <div className="section-heading"><h2 className="section-title">아리모리가 만드는 무대</h2></div>
          <div className="performance-grid">
            {performances.map(({ icon: Icon, title, text }) => (
              <article className="performance-card" key={title}>
                <span className="performance-card__icon"><Icon size={23} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
