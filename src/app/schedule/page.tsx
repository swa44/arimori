import { CalendarView } from "@/components/schedule/CalendarView";
import { getPublicSchedules } from "@/lib/supabase/schedules";
import { getApprovedScheduleReviews } from "@/lib/supabase/events";

export const metadata = { title: "공연 일정" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const baseSchedules = await getPublicSchedules();
  const reviews = await getApprovedScheduleReviews(baseSchedules.map((item) => item.id));
  const schedules = baseSchedules.map((item) => ({
    ...item,
    reviews: reviews.filter((review) => review.schedule_id === item.id),
  }));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return <div className="schedule-page page-pattern page-pattern--schedule"><CalendarView schedules={schedules} today={today} /></div>;
}
