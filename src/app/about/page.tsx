/* eslint-disable @next/next/no-img-element */
import {
  BookOpen,
  Disc3,
  HeartHandshake,
  MapPinned,
  Theater,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getAboutImagePath,
  getSiteImageUrl,
} from "@/lib/supabase/site-settings";

export const metadata = { title: "소개" };
export const dynamic = "force-dynamic";

const performances = [
  {
    icon: Theater,
    title: "기획·초청 공연",
    text: "자체 정기공연부터 지역 축제와 기관 행사, 기업 공연까지 공간과 관객에게 꼭 맞는 무대를 함께 만들어갑니다.",
  },
  {
    icon: MapPinned,
    title: "찾아가는 문화예술공연",
    text: "학교와 도서관, 공공기관, 기업, 복지시설 등 관객이 있는 곳이라면 어디든 찾아가 즐거운 공연을 나눕니다.",
  },
  {
    icon: BookOpen,
    title: "문화예술교육 프로그램",
    text: "보고 듣는 공연을 넘어 직접 참여하고 경험하며 예술과 한층 가까워지는 시간을 마련합니다.",
  },
  {
    icon: HeartHandshake,
    title: "문화복지 프로그램",
    text: "문화예술을 만나기 어려웠던 이웃의 일상에도 따뜻한 음악과 즐거운 무대가 닿을 수 있도록 찾아갑니다.",
  },
  {
    icon: Disc3,
    title: "창작·앨범 제작 활동",
    text: "아리모리만의 색과 이야기를 담은 음악을 만들고, 음원과 앨범으로 오래도록 나눕니다.",
  },
];

const values = [
  {
    title: "새로운 퓨전국악",
    text: "한국 전통음악과 클래식을 오늘의 감각으로 잇고, 누구나 편안하게 즐길 수 있는 음악을 만듭니다.",
  },
  {
    title: "청년 예술인의 기회",
    text: "청년 예술인들이 마음껏 재능을 펼치고 꾸준히 음악을 이어갈 수 있는 무대를 넓혀갑니다.",
  },
  {
    title: "지역 문화예술의 성장",
    text: "우리 지역의 인물과 이야기를 공연에 담아, 가까운 일상 속에 새로운 문화의 즐거움을 더합니다.",
  },
  {
    title: "모두를 위한 문화복지",
    text: "문화예술이 필요한 곳으로 먼저 찾아가고, 다양한 이웃과 손잡아 따뜻한 지역사회를 만들어갑니다.",
  },
];

const history = [
  {
    year: "2022",
    title: "지역의 이야기에서 시작",
    text: "경기도 문화의 날 수요명화음악회와 서울대공원 숲속콘서트에 참여했습니다. 이천의 마을 이야기와 50년 역사를 공연으로 만들었으며, 설봉문화제 이천갓탤런트 대상과 이천시 문화자치활성화 우수사례 표창을 받았습니다.",
  },
  {
    year: "2023",
    title: "무대와 창작의 확장",
    text: "서울Y클래식페스티벌, 천안예술의전당, 문화배달프로그램 등에서 공연하고 OBS 방송과 캐나다 잼버리 대원 초청 무대를 진행했습니다. 경기도 청년공동체 최우수상을 수상하고 첫 디지털 싱글 〈Restart〉를 발매했습니다.",
  },
  {
    year: "2024",
    title: "경기도 전문예술단체 지정",
    text: "경기도 전문예술단체로 지정되었습니다. 〈대한의 꿈〉, 〈퓨전국악이 탱고를 만나면?〉, 〈민족운동가 구연영을 만나다〉를 공연하고, 경기이룸학교 〈이천이야기뮤지컬〉과 우리동네 문화학교를 운영했습니다.",
  },
  {
    year: "2025",
    title: "문화복지와 지역 콘텐츠",
    text: "한국장애인문화예술원 문화향유사업 〈그린 하모니 콘서트〉와 우리동네 문화학교 〈모가랑 우리랑〉을 운영했습니다. 디지털 싱글 〈Jindo Tango〉를 발매하고 〈광주를 빛낸 인물: 3인 3색 이야기음악회〉를 선보였습니다.",
  },
  {
    year: "2026",
    title: "더 많은 관객의 일상으로",
    text: "영등포봄꽃축제, 세계목재박람회와 코엑스 공연을 비롯해 30회 이상의 축제·기관 행사를 진행했습니다. 〈마음모아 소리모아〉, 여주 인물열전, 〈대한의 꿈〉, 성평등 콘서트를 기획하고 1월부터 8월까지 40회 이상의 찾아가는 문화예술공연을 이어갔습니다.",
  },
];

export default async function AboutPage() {
  const aboutImageUrl = getSiteImageUrl(await getAboutImagePath());

  return (
    <div className="page-pattern page-pattern--about">
      <PageHeader eyebrow="ABOUT ARIMORI" title="아리모리앙상블" />
      <div className="page-wrap">
        <section className="about-introduction">
          {aboutImageUrl && (
            <div className="about-introduction__image">
              <img src={aboutImageUrl} alt="아리모리 앙상블 공연 모습" />
            </div>
          )}
          <div className="about-introduction__copy">
            <p>
              <strong>아리모리 앙상블</strong>은 노래하듯 아름답게 표현한다는
              서양음악 용어 ‘아리오소’와 국악 장단의 ‘-모리’를 합쳐 만든
              이름입니다. <br></br>이름처럼 한국의 전통악기와 서양악기가 한
              무대에서 자연스럽게 어우러져, 익숙하면서도 새로운 퓨전국악의
              즐거움을 전합니다.
            </p>
            <p>
              국악과 클래식을 사랑하는 청년 전문예술인들이 모여 음악을 만들고
              있습니다. <br></br>2024년 경기도 전문예술단체로 지정된 아리모리
              앙상블은, 더 많은 분들의 일상 가까이에서 음악으로 만날 수 있도록
              전국 곳곳의 무대를 찾아가고 있습니다.
            </p>
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-values-title">
          <div className="section-heading">
            <h2 className="section-title" id="about-values-title">
              아리모리가 이어가는 가치
            </h2>
          </div>
          <div className="about-values">
            {values.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="about-section"
          aria-labelledby="about-history-title"
        >
          <div className="section-heading">
            <h2 className="section-title" id="about-history-title">
              주요 활동
            </h2>
          </div>
          <div className="about-timeline">
            {history.map((item) => (
              <article key={item.year}>
                <div className="about-timeline__year">{item.year}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-stage-title">
          <div className="section-heading">
            <h2 className="section-title" id="about-stage-title">
              아리모리가 만드는 무대
            </h2>
          </div>
          <div className="performance-grid">
            {performances.map(({ icon: Icon, title, text }) => (
              <article className="performance-card" key={title}>
                <span className="performance-card__icon">
                  <Icon size={23} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
