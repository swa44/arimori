import { createClient } from "@/lib/supabase/server";

export type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string;
  display_order: number;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPublicVideos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ARIMORI_videos")
    .select("*")
    .eq("is_public", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as VideoRow[];
}
