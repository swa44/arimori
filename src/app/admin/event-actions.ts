"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, type AdminActionState } from "./actions";
import { createServiceClient } from "@/lib/supabase/service";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const bool = (formData: FormData, key: string) => formData.get(key) === "on";
const fail = (error: unknown): AdminActionState => ({ error: error instanceof Error ? error.message : "처리하지 못했습니다." });

function dateTimeIso(value: string) {
  if (!value) throw new Error("기간을 입력해 주세요.");
  return new Date(`${value}:00+09:00`).toISOString();
}

export async function createStampProgram(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const title = text(formData, "title");
  const slug = text(formData, "slug").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const required = Number(text(formData, "required_stamps"));
  if (!title || !slug) return { error: "프로그램명과 영문 주소를 입력해 주세요." };
  if (!Number.isInteger(required) || required < 1 || required > 100) return { error: "필요 스탬프 수는 1~100으로 입력해 주세요." };
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("ARIMORI_stamp_programs").insert({
    title, slug, description: text(formData, "description") || null,
    starts_on: text(formData, "starts_on"), ends_on: text(formData, "ends_on"),
    required_stamps: required, is_active: bool(formData, "is_active"),
  }).select("id").single();
  if (error) return fail(error.code === "23505" ? new Error("이미 사용 중인 영문 주소입니다.") : error);
  redirect(`/admin/event/stamp/${data.id}`);
}

export async function updateStampProgram(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = text(formData, "id");
  const required = Number(text(formData, "required_stamps"));
  const supabase = createServiceClient();
  const { error } = await supabase.from("ARIMORI_stamp_programs").update({
    title: text(formData, "title"), description: text(formData, "description") || null,
    starts_on: text(formData, "starts_on"), ends_on: text(formData, "ends_on"),
    required_stamps: required, is_active: bool(formData, "is_active"),
  }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/event"); revalidatePath(`/admin/event/stamp/${id}`);
  return { error: null, success: "저장했습니다." };
}

export async function addStampBooth(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const programId = text(formData, "program_id");
  const name = text(formData, "name");
  if (!name) return { error: "부스명을 입력해 주세요." };
  const supabase = createServiceClient();
  const { count } = await supabase.from("ARIMORI_stamp_booths").select("id", { count: "exact", head: true }).eq("program_id", programId);
  const { error } = await supabase.from("ARIMORI_stamp_booths").insert({ program_id: programId, name, description: text(formData, "description") || null, display_order: count ?? 0 });
  if (error) return fail(error);
  revalidatePath(`/admin/event/stamp/${programId}`);
  return { error: null, success: "부스를 추가했습니다." };
}

export async function deleteStampBooth(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id"); const programId = text(formData, "program_id");
  const { error } = await createServiceClient().from("ARIMORI_stamp_booths").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/event/stamp/${programId}`);
}

function extractParticipantToken(raw: string) {
  const match = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match?.[0] ?? "";
}

export async function recordStamp(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const boothId = text(formData, "booth_id");
  const token = extractParticipantToken(text(formData, "qr_value"));
  if (!token) return { error: "올바른 참여자 QR이 아닙니다." };
  const supabase = createServiceClient();
  const [{ data: booth }, { data: participant }] = await Promise.all([
    supabase.from("ARIMORI_stamp_booths").select("id, program_id, name").eq("id", boothId).single(),
    supabase.from("ARIMORI_stamp_participants").select("id, program_id, display_name").eq("public_token", token).single(),
  ]);
  if (!booth || !participant || booth.program_id !== participant.program_id) return { error: "이 프로그램의 참여자 QR이 아닙니다." };
  const { error } = await supabase.from("ARIMORI_stamp_records").insert({ participant_id: participant.id, booth_id: booth.id, stamped_by: user.id });
  if (error?.code === "23505") return { error: `${participant.display_name}님은 이 부스 스탬프를 이미 받았습니다.` };
  if (error) return fail(error);
  const [{ count }, { data: program }] = await Promise.all([
    supabase.from("ARIMORI_stamp_records").select("id", { count: "exact", head: true }).eq("participant_id", participant.id),
    supabase.from("ARIMORI_stamp_programs").select("required_stamps").eq("id", participant.program_id).single(),
  ]);
  if ((count ?? 0) >= (program?.required_stamps ?? Number.MAX_SAFE_INTEGER)) {
    await supabase.from("ARIMORI_stamp_participants").update({ completed_at: new Date().toISOString() }).eq("id", participant.id).is("completed_at", null);
  }
  return { error: null, success: `${participant.display_name}님 · ${booth.name} 스탬프를 기록했습니다.` };
}

export async function redeemStampReward(formData: FormData) {
  await requireAdmin();
  const participantId = text(formData, "participant_id"); const programId = text(formData, "program_id");
  const { error } = await createServiceClient().from("ARIMORI_stamp_participants").update({ reward_redeemed_at: new Date().toISOString() }).eq("id", participantId).not("completed_at", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/event/stamp/${programId}`);
}

export async function createReviewCampaign(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const scheduleId = text(formData, "schedule_id"); const title = text(formData, "title");
  if (!scheduleId || !title) return { error: "공연과 이벤트명을 입력해 주세요." };
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("ARIMORI_review_campaigns").insert({
    schedule_id: scheduleId, title, access_token: crypto.randomUUID(),
    opens_at: dateTimeIso(text(formData, "opens_at")), closes_at: dateTimeIso(text(formData, "closes_at")), is_active: bool(formData, "is_active"),
  }).select("id").single();
  if (error) return fail(error);
  redirect(`/admin/event/review/${data.id}`);
}

export async function updateReviewCampaign(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin(); const id = text(formData, "id");
  const { error } = await createServiceClient().from("ARIMORI_review_campaigns").update({
    title: text(formData, "title"), opens_at: dateTimeIso(text(formData, "opens_at")), closes_at: dateTimeIso(text(formData, "closes_at")), is_active: bool(formData, "is_active"),
  }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/event"); revalidatePath(`/admin/event/review/${id}`);
  return { error: null, success: "저장했습니다." };
}

export async function updateReviewState(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id"); const campaignId = text(formData, "campaign_id"); const action = text(formData, "action");
  const supabase = createServiceClient();
  if (action === "delete") await supabase.from("ARIMORI_event_reviews").delete().eq("id", id);
  else if (action === "winner") await supabase.from("ARIMORI_event_reviews").update({ is_winner: bool(formData, "next_winner") }).eq("id", id);
  else if (["pending", "approved", "rejected"].includes(action)) await supabase.from("ARIMORI_event_reviews").update({ status: action }).eq("id", id);
  revalidatePath(`/admin/event/review/${campaignId}`); revalidatePath("/schedule"); revalidatePath("/");
}
