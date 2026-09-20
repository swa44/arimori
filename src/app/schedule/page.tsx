import { CalendarView } from "@/components/schedule/CalendarView";
import { getPublicSchedules } from "@/lib/supabase/schedules";

export const metadata = { title: "공연 일정" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const schedules = await getPublicSchedules();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return <div className="schedule-page page-pattern page-pattern--schedule"><CalendarView schedules={schedules} today={today} /></div>;
}
