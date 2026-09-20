import { createClient as createPublicClient } from "@supabase/supabase-js";
import type { BookingType, Schedule } from "@/data/content";
import { schedules as mockSchedules } from "@/data/content";
import { isSupabaseConfigured, requireSupabaseConfig } from "./config";

export type ScheduleRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  location: string;
  address: string | null;
  description: string | null;
  poster_path: string | null;
  poster_paths: string[] | null;
  map_query: string | null;
  map_url: string | null;
  booking_type: BookingType | null;
  booking_url: string | null;
  category: string;
  is_public: boolean;
  is_cancelled: boolean;
  is_featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const koreaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const koreaTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function rowToSchedule(row: ScheduleRow): Schedule {
  const start = new Date(row.start_at);
  const posterPaths = row.poster_paths?.length ? row.poster_paths : row.poster_path ? [row.poster_path] : [];
  const posterUrls = posterPaths.map(getPosterUrl).filter((url): url is string => Boolean(url));
  return {
    id: row.id,
    title: row.title,
    date: koreaDateFormatter.format(start),
    time: koreaTimeFormatter.format(start),
    location: row.location,
    address: row.address ?? "장소 상세 준비 중",
    description: row.description ?? "공연 상세 내용은 곧 안내할 예정입니다.",
    category: row.category,
    tone: row.is_cancelled ? "brown" : row.is_featured ? "olive" : "teal",
    posterPath: row.poster_path,
    posterUrl: posterUrls[0] ?? null,
    posterPaths,
    posterUrls,
    mapQuery: row.map_query ?? row.location,
    mapUrl: row.map_url,
    bookingType: row.booking_type ?? (row.booking_url ? "reservation" : "free"),
    bookingUrl: row.booking_url,
    isCancelled: row.is_cancelled,
    isFeatured: row.is_featured,
  };
}

export async function getPublicSchedules(): Promise<Schedule[]> {
  if (!isSupabaseConfigured()) return mockSchedules;

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  const supabase = createPublicClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("ARIMORI_schedules")
    .select("*")
    .eq("is_public", true)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("공개 일정을 불러오지 못했습니다.", error.message);
    return [];
  }

  return (data as ScheduleRow[]).map(rowToSchedule);
}

export function getPosterUrl(path: string | null | undefined) {
  if (!path || !isSupabaseConfigured()) return null;
  const { supabaseUrl } = requireSupabaseConfig();
  return `${supabaseUrl}/storage/v1/object/public/ARIMORI_posters/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
