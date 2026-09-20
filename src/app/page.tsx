import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FeaturedEventCard } from "@/components/home/FeaturedEventCard";
import { newsItems } from "@/data/content";
import { getPublicSchedules } from "@/lib/supabase/schedules";
import { getHomeHeroSettings } from "@/lib/supabase/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [schedules, hero] = await Promise.all([getPublicSchedules(), getHomeHeroSettings()]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const upcomingSchedules = schedules.filter((item) => !item.isCancelled && item.date >= today);
  const featured = upcomingSchedules.find((item) => item.isFeatured) ?? upcomingSchedules[0];

  return (
    <>
      <section className="hero">
        <div className="hero__top">
          <span className="hero__brand">아리모리앙상블</span>
          <span className="hero__ornament" aria-hidden="true"><i /><i /><i /></span>
        </div>

        <div className="hero__content">
          <p className="hero__kicker">{hero.kicker}</p>
          <h1 className="hero__title">
            {hero.title}
            <span>{hero.subtitle}</span>
          </h1>
        </div>

        <FeaturedEventCard schedule={featured ?? null} today={today} />
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
