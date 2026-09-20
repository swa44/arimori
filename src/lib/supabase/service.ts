import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./config";

export function createServiceClient() {
  const { supabaseUrl } = requireSupabaseConfig();
  const secretKey = process.env.ARIMORI_SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("ARIMORI_SUPABASE_SECRET_KEY 환경변수가 필요합니다.");

  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
