import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { newsItems, schedules } from "@/data/content";

export default function HomePage() {
  const featured = schedules[0];

  return (
    <>
      <section className="hero">
        <div className="hero__top">
          <span className="hero__brand">아리모리</span>
          <span className="hero__ornament" aria-hidden="true"><i /><i /><i /></span>
        </div>

        <div className="hero__content">
          <p className="hero__kicker">TRADITION, CLOSE TO YOU</p>
          <h1 className="hero__title">
            오래된 멋을
            <span>오늘의 우리 곁으로</span>
          </h1>
        </div>

        <article className="hero__event-card">
          <div className="date-block"><span>SEP</span><strong>20</strong></div>
          <div>
            <span className="tag">다가오는 공연</span>
            <h2>{featured.title}</h2>
            <p>{featured.time} · {featured.location}</p>
          </div>
          <Link href="/schedule" className="circle-button" aria-label="공연 일정 보기">
            <ArrowRight size={17} />
          </Link>
        </article>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2 className="section-title">아리모리 소식</h2>
          <Link href="/about" className="section-link">더 알아보기 <ChevronRight size={14} /></Link>
        </div>
        <div className="news-list">
          {newsItems.map((item) => (
            <article className="news-item" key={item.title}>
              <span className="news-item__date">{item.date}</span>
              <div>
                <span className={`tag ${item.tag === "기록" ? "tag--brown" : item.tag === "안내" ? "tag--teal" : ""}`}>{item.tag}</span>
                <h3>{item.title}</h3>
              </div>
              <ChevronRight size={16} color="#99938a" />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
