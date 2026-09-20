"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export type EventActionState = { error: string | null; success?: string };

function digits(value: FormDataEntryValue | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function joinStampProgram(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phone = digits(formData.get("phone"));
  if (!displayName || displayName.length > 30) return { error: "이름 또는 별명을 30자 이내로 입력해 주세요." };
  if (phone.length < 10 || phone.length > 11) return { error: "연락처를 정확히 입력해 주세요." };
  if (formData.get("privacy_agreed") !== "on") return { error: "개인정보 수집 및 이용에 동의해 주세요." };

  let destination = "";
  try {
    const supabase = createServiceClient();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const { data: program } = await supabase.from("ARIMORI_stamp_programs").select("id, is_active, starts_on, ends_on").eq("id", programId).single();
    if (!program || !program.is_active || today < program.starts_on || today > program.ends_on) return { error: "현재 참여할 수 없는 스탬프 프로그램입니다." };

    const { data: existing } = await supabase.from("ARIMORI_stamp_participants").select("public_token").eq("program_id", programId).eq("phone", phone).maybeSingle();
    if (existing?.public_token) destination = `/event/stamp/${slug}/card/${existing.public_token}`;

    if (!destination) {
      const publicToken = crypto.randomUUID();
      const { error } = await supabase.from("ARIMORI_stamp_participants").insert({
        program_id: programId,
        public_token: publicToken,
        display_name: displayName,
        phone,
        privacy_agreed: true,
      });
      if (error) {
        if (error.code === "23505") return { error: "이미 참여한 연락처입니다. 페이지를 새로고침한 뒤 다시 입력해 주세요." };
        return { error: `참여 등록 실패: ${error.message}` };
      }
      destination = `/event/stamp/${slug}/card/${publicToken}`;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "참여 등록 중 오류가 발생했습니다." };
  }
  redirect(destination);
}

export async function submitEventReview(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const accessToken = String(formData.get("access_token") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const phone = digits(formData.get("phone"));
  const content = String(formData.get("content") ?? "").trim();
  if (!displayName || displayName.length > 30) return { error: "이름 또는 별명을 30자 이내로 입력해 주세요." };
  if (phone.length < 10 || phone.length > 11) return { error: "연락처를 정확히 입력해 주세요." };
  if (!content || content.length > 500) return { error: "후기를 500자 이내로 입력해 주세요." };
  if (formData.get("privacy_agreed") !== "on") return { error: "개인정보 수집 및 이용에 동의해 주세요." };

  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const { data: campaign } = await supabase.from("ARIMORI_review_campaigns").select("id, schedule_id, is_active, opens_at, closes_at").eq("access_token", accessToken).single();
    if (!campaign || !campaign.is_active || now < campaign.opens_at || now > campaign.closes_at) return { error: "후기 참여 기간이 아니거나 종료된 행사입니다." };

    const { error } = await supabase.from("ARIMORI_event_reviews").insert({
      campaign_id: campaign.id,
      schedule_id: campaign.schedule_id,
      display_name: displayName,
      phone,
      content,
      privacy_agreed: true,
      public_agreed: formData.get("public_agreed") === "on",
    });
    if (error?.code === "23505") return { error: "이 공연에는 이미 후기를 남기셨습니다." };
    if (error) return { error: `후기 접수 실패: ${error.message}` };
    return { error: null, success: "후기와 추첨 응모가 접수되었습니다. 참여해 주셔서 감사합니다." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "후기 접수 중 오류가 발생했습니다." };
  }
}
