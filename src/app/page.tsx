import { FeaturedEventCard } from "@/components/home/FeaturedEventCard";
import { NewsSection } from "@/components/home/NewsSection";
import { getPublicNews } from "@/lib/supabase/news";
import { getPublicSchedules } from "@/lib/supabase/schedules";
import { getHomeHeroSettings } from "@/lib/supabase/site-settings";
import { getApprovedScheduleReviews, getLinkedStampPrograms } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [baseSchedules, hero, news] = await Promise.all([getPublicSchedules(), getHomeHeroSettings(), getPublicNews()]);
  const scheduleIds = baseSchedules.map((item) => item.id);
  const [reviews, stampPrograms] = await Promise.all([getApprovedScheduleReviews(scheduleIds), getLinkedStampPrograms(scheduleIds)]);
  const schedules = baseSchedules.map((item) => ({ ...item, reviews: reviews.filter((review) => review.schedule_id === item.id), stampProgram: stampPrograms.find((program) => program.schedule_id === item.id) ?? null }));
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

      <NewsSection news={news} />
    </>
  );
}
