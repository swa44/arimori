import { createClient as createPublicClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, requireSupabaseConfig } from "./config";
import type { AboutStageImage } from "@/data/about-stages";

export const defaultHomeHero = {
  kicker: "TRADITION, CLOSE TO YOU",
  title: "오래된 멋을",
  subtitle: "오늘의 우리 곁으로",
};

export function getSiteImageUrl(path: string | null | undefined) {
  if (!path || !isSupabaseConfigured()) return null;
  const { supabaseUrl } = requireSupabaseConfig();
  return `${supabaseUrl}/storage/v1/object/public/ARIMORI_site_images/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getAboutStageImages() {
  if (!isSupabaseConfigured()) return [] as AboutStageImage[];
  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  const supabase = createPublicClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("ARIMORI_about_stage_images").select("*").order("stage_key").order("display_order").order("created_at");
  if (error) return [];
  return (data ?? []) as AboutStageImage[];
}

export async function getAboutImagePath() {
  if (!isSupabaseConfigured()) return null;
  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  const supabase = createPublicClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.from("ARIMORI_site_settings").select("about_image_path").eq("id", true).maybeSingle();
  return data?.about_image_path as string | null ?? null;
}

export async function getHomeHeroSettings() {
  if (!isSupabaseConfigured()) return defaultHomeHero;
  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  const supabase = createPublicClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase
    .from("ARIMORI_site_settings")
    .select("home_hero_kicker, home_hero_title, home_hero_subtitle")
    .eq("id", true)
    .maybeSingle();

  return {
    kicker: data?.home_hero_kicker?.trim() || defaultHomeHero.kicker,
    title: data?.home_hero_title?.trim() || defaultHomeHero.title,
    subtitle: data?.home_hero_subtitle?.trim() || defaultHomeHero.subtitle,
  };
}
