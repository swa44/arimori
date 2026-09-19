import { BookOpen, Disc3, HeartHandshake, MapPinned, Theater } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const performances = [
  { icon: Theater, title: "기획·초청 공연", text: "자체 기획공연부터 공모사업, 지역 축제와 기관 행사까지 공간과 관객에 어울리는 무대를 만듭니다." },
  { icon: MapPinned, title: "찾아가는 문화예술공연", text: "학교, 도서관, 공공기관, 기업, 복지시설 등 관객이 있는 곳으로 찾아가는 맞춤형 공연입니다." },
  { icon: BookOpen, title: "문화예술교육 프로그램", text: "공연의 감동을 직접 경험하고 표현할 수 있도록 체험과 참여 중심의 예술교육을 운영합니다." },
  { icon: HeartHandshake, title: "문화복지 프로그램", text: "문화예술을 접하기 어려운 이웃의 일상에 따뜻한 무대를 전하는 예술 나눔 활동입니다." },
  { icon: Disc3, title: "창작·앨범 제작 활동", text: "아리모리만의 색을 담은 음원과 앨범을 제작하고, 장르의 경계를 넘나드는 창작 활동을 이어갑니다." },
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
