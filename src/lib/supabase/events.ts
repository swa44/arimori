import { createServiceClient } from "./service";

export type StampProgram = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  starts_on: string;
  ends_on: string;
  required_stamps: number;
  is_active: boolean;
  created_at: string;
  schedule_id: string | null;
};

export type StampBooth = {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  display_order: number;
  access_code_hash?: string | null;
};

export type StampParticipant = {
  id: string;
  program_id: string;
  public_token: string;
  display_name: string;
  phone: string;
  privacy_agreed: boolean;
  completed_at: string | null;
  reward_redeemed_at: string | null;
  created_at: string;
};

export type ReviewCampaign = {
  id: string;
  schedule_id: string;
  title: string;
  access_token: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
  created_at: string;
};

export type EventReview = {
  id: string;
  campaign_id: string;
  schedule_id: string;
  display_name: string;
  phone: string;
  content: string;
  privacy_agreed: boolean;
  public_agreed: boolean;
  status: "pending" | "approved" | "rejected";
  is_winner: boolean;
  created_at: string;
};

export type PublicScheduleReview = Pick<EventReview, "id" | "schedule_id" | "display_name" | "content" | "created_at">;

export async function getActiveEventPrograms() {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const [{ data: stamps }, { data: reviews }] = await Promise.all([
      supabase.from("ARIMORI_stamp_programs").select("*").eq("is_active", true).lte("starts_on", today).gte("ends_on", today).order("starts_on"),
      supabase.from("ARIMORI_review_campaigns").select("*").eq("is_active", true).lte("opens_at", now).gte("closes_at", now).order("opens_at", { ascending: false }),
    ]);
    return {
      stamps: (stamps ?? []) as StampProgram[],
      reviews: (reviews ?? []) as ReviewCampaign[],
    };
  } catch {
    return { stamps: [] as StampProgram[], reviews: [] as ReviewCampaign[] };
  }
}

export async function getApprovedScheduleReviews(scheduleIds: string[]) {
  if (!scheduleIds.length) return [] as PublicScheduleReview[];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("ARIMORI_event_reviews")
      .select("id, schedule_id, display_name, content, created_at")
      .in("schedule_id", scheduleIds)
      .eq("status", "approved")
      .eq("public_agreed", true)
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as PublicScheduleReview[];
  } catch {
    return [];
  }
}

export async function getLinkedStampPrograms(scheduleIds: string[]) {
  if (!scheduleIds.length) return [] as Array<{ schedule_id: string; slug: string; title: string }>;
  try {
    const supabase = createServiceClient();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const { data } = await supabase
      .from("ARIMORI_stamp_programs")
      .select("schedule_id, slug, title")
      .in("schedule_id", scheduleIds)
      .eq("is_active", true)
      .lte("starts_on", today)
      .gte("ends_on", today);
    return (data ?? []) as Array<{ schedule_id: string; slug: string; title: string }>;
  } catch {
    return [];
  }
}
