"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createBoothSession, hasBoothSession, verifyBoothCode } from "@/lib/booth-auth";

export type EventActionState = { error: string | null; success?: string };

function digits(value: FormDataEntryValue | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function joinStampProgram(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const phone = digits(formData.get("phone"));
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
        display_name: "참가자",
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

export async function findStampCard(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const phone = digits(formData.get("phone"));
  if (phone.length < 10 || phone.length > 11) return { error: "처음 참여할 때 입력한 연락처를 정확히 입력해 주세요." };

  let destination = "";
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ARIMORI_stamp_participants")
      .select("public_token")
      .eq("program_id", programId)
      .eq("phone", phone)
      .maybeSingle();
    if (error) return { error: `스탬프 카드 조회 실패: ${error.message}` };
    if (!data?.public_token) return { error: "이 연락처로 만든 스탬프 카드를 찾지 못했습니다." };
    destination = `/event/stamp/${slug}/card/${data.public_token}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "스탬프 카드를 찾는 중 오류가 발생했습니다." };
  }
  redirect(destination);
}

export async function loginBoothStaff(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const programId = String(formData.get("program_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const boothId = String(formData.get("booth_id") ?? "");
  const code = String(formData.get("access_code") ?? "").trim();
  if (!boothId || !code) return { error: "담당 부스와 인증코드를 입력해 주세요." };
  let destination = "";
  try {
    const { data, error } = await createServiceClient().from("ARIMORI_stamp_booths").select("id, program_id, access_code_hash").eq("id", boothId).eq("program_id", programId).maybeSingle();
    if (error || !data?.access_code_hash || !verifyBoothCode(code, data.access_code_hash)) return { error: "부스 또는 인증코드가 올바르지 않습니다." };
    await createBoothSession(boothId);
    destination = `/event/stamp/${slug}/staff/${boothId}`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "부스 담당자 로그인 중 오류가 발생했습니다." };
  }
  redirect(destination);
}

function participantToken(raw: string) {
  return raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0] ?? "";
}

export async function recordStaffStamp(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const boothId = String(formData.get("booth_id") ?? "");
  if (!await hasBoothSession(boothId)) return { error: "담당자 로그인이 만료되었습니다. 다시 로그인해 주세요." };
  const token = participantToken(String(formData.get("qr_value") ?? ""));
  if (!token) return { error: "올바른 참여자 QR이 아닙니다." };
  try {
    const supabase = createServiceClient();
    const [{ data: booth }, { data: participant }] = await Promise.all([
      supabase.from("ARIMORI_stamp_booths").select("id, program_id, name").eq("id", boothId).single(),
      supabase.from("ARIMORI_stamp_participants").select("id, program_id, phone").eq("public_token", token).single(),
    ]);
    if (!booth || !participant || booth.program_id !== participant.program_id) return { error: "이 프로그램의 참여자 QR이 아닙니다." };
    const { error } = await supabase.from("ARIMORI_stamp_records").insert({ participant_id: participant.id, booth_id: booth.id });
    const phoneSuffix = String(participant.phone).slice(-4);
    if (error?.code === "23505") return { error: `연락처 뒷자리 ${phoneSuffix} 참가자는 이 부스 스탬프를 이미 받았습니다.` };
    if (error) return { error: `스탬프 기록 실패: ${error.message}` };
    const [{ count }, { data: program }] = await Promise.all([
      supabase.from("ARIMORI_stamp_records").select("id", { count: "exact", head: true }).eq("participant_id", participant.id),
      supabase.from("ARIMORI_stamp_programs").select("required_stamps").eq("id", participant.program_id).single(),
    ]);
    if ((count ?? 0) >= (program?.required_stamps ?? Number.MAX_SAFE_INTEGER)) await supabase.from("ARIMORI_stamp_participants").update({ completed_at: new Date().toISOString() }).eq("id", participant.id).is("completed_at", null);
    return { error: null, success: `연락처 뒷자리 ${phoneSuffix} · ${booth.name} 스탬프를 기록했습니다.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "스탬프 기록 중 오류가 발생했습니다." };
  }
}

export async function submitEventReview(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const accessToken = String(formData.get("access_token") ?? "");
  const phone = digits(formData.get("phone"));
  const content = String(formData.get("content") ?? "").trim();
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
      display_name: "익명",
      phone,
      content,
      privacy_agreed: true,
      public_agreed: true,
      status: "approved",
    });
    if (error?.code === "23505") return { error: "이 공연에는 이미 후기를 남기셨습니다." };
    if (error) return { error: `후기 접수 실패: ${error.message}` };
    return { error: null, success: "후기와 추첨 응모가 접수되었습니다. 참여해 주셔서 감사합니다." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "후기 접수 중 오류가 발생했습니다." };
  }
}
