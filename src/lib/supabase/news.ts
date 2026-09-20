import { createClient } from "@/lib/supabase/server";

export type NewsRow = {
  id: string;
  badge: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPublicNews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ARIMORI_news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as NewsRow[];
}
