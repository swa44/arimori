import { CalendarView } from "@/components/schedule/CalendarView";
import { getPublicSchedules } from "@/lib/supabase/schedules";
import { getAnnouncedReviewWinners, getAnnouncedStampWinners, getApprovedScheduleReviews, getLinkedStampPrograms } from "@/lib/supabase/events";

export const metadata = { title: "공연 일정" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const baseSchedules = await getPublicSchedules();
  const scheduleIds = baseSchedules.map((item) => item.id);
  const [reviews, reviewWinners, stampWinners, stampPrograms] = await Promise.all([getApprovedScheduleReviews(scheduleIds), getAnnouncedReviewWinners(scheduleIds), getAnnouncedStampWinners(scheduleIds), getLinkedStampPrograms(scheduleIds)]);
  const schedules = baseSchedules.map((item) => ({
    ...item,
    reviews: reviews.filter((review) => review.schedule_id === item.id),
    reviewWinners: reviewWinners.filter((winner) => winner.schedule_id === item.id),
    stampWinners: stampWinners.filter((winner) => winner.schedule_id === item.id),
    stampProgram: stampPrograms.find((program) => program.schedule_id === item.id) ?? null,
  }));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return <div className="schedule-page page-pattern page-pattern--schedule"><CalendarView schedules={schedules} today={today} /></div>;
}
