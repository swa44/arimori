import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarView } from "@/components/schedule/CalendarView";
import { getPublicSchedules } from "@/lib/supabase/schedules";

export const metadata = { title: "공연 일정" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const schedules = await getPublicSchedules();
  return (
    <>
      <PageHeader eyebrow="SCHEDULE" title="공연 일정" description="달력에서 날짜를 선택하면 그날의 공연과 자세한 정보를 확인할 수 있어요." />
      <div className="page-wrap"><CalendarView schedules={schedules} /></div>
    </>
  );
}
