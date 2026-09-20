import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

export function createAdminClient() {
  const secretKey = process.env.ARIMORI_SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase 서버 전용 환경변수가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
