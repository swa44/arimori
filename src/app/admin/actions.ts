"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = {
  error: string | null;
};

function actionError(error: unknown): AdminActionState {
  return {
    error: error instanceof Error ? error.message : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  };
}

function nullableText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function koreaDateTimeToIso(value: string) {
  if (!value) return null;
  return new Date(`${value}:00+09:00`).toISOString();
}

function safeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("ARIMORI_is_admin");
  if (error || !isAdmin) redirect("/admin/login?error=forbidden");

  return { supabase, user };
}

async function uploadPoster(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  userId: string,
) {
  if (!file.size) return null;

  const path = `${userId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from("ARIMORI_posters")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`포스터 업로드 실패: ${error.message}`);
  return path;
}

export async function createSchedule(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();
  let posterPath: string | null = null;

  try {
    const poster = formData.get("poster");
    posterPath = poster instanceof File ? await uploadPoster(supabase, poster, user.id) : null;

    const { error } = await supabase.from("ARIMORI_schedules").insert({
      title: String(formData.get("title") ?? "").trim(),
      start_at: koreaDateTimeToIso(String(formData.get("start_at") ?? "")),
      end_at: koreaDateTimeToIso(String(formData.get("end_at") ?? "")),
      location: String(formData.get("location") ?? "").trim(),
      address: nullableText(formData, "address"),
      description: nullableText(formData, "description"),
      poster_path: posterPath,
      map_url: nullableText(formData, "map_url"),
      booking_url: nullableText(formData, "booking_url"),
      category: String(formData.get("category") ?? "공연").trim(),
      is_public: formData.get("is_public") === "on",
      is_cancelled: false,
      is_featured: formData.get("is_featured") === "on",
      created_by: user.id,
    });

    if (error) throw new Error(`일정 등록 실패: ${error.message}`);
  } catch (error) {
    if (posterPath) await supabase.storage.from("ARIMORI_posters").remove([posterPath]);
    return actionError(error);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSchedule(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const oldPosterPath = nullableText(formData, "old_poster_path");
  let newPosterPath = oldPosterPath;

  try {
    const poster = formData.get("poster");
    newPosterPath = poster instanceof File && poster.size
      ? await uploadPoster(supabase, poster, user.id)
      : oldPosterPath;

    const { error } = await supabase
      .from("ARIMORI_schedules")
      .update({
        title: String(formData.get("title") ?? "").trim(),
        start_at: koreaDateTimeToIso(String(formData.get("start_at") ?? "")),
        end_at: koreaDateTimeToIso(String(formData.get("end_at") ?? "")),
        location: String(formData.get("location") ?? "").trim(),
        address: nullableText(formData, "address"),
        description: nullableText(formData, "description"),
        poster_path: newPosterPath,
        map_url: nullableText(formData, "map_url"),
        booking_url: nullableText(formData, "booking_url"),
        category: String(formData.get("category") ?? "공연").trim(),
        is_public: formData.get("is_public") === "on",
        is_cancelled: formData.get("is_cancelled") === "on",
        is_featured: formData.get("is_featured") === "on",
      })
      .eq("id", id);

    if (error) throw new Error(`일정 수정 실패: ${error.message}`);
  } catch (error) {
    if (newPosterPath && newPosterPath !== oldPosterPath) {
      await supabase.storage.from("ARIMORI_posters").remove([newPosterPath]);
    }
    return actionError(error);
  }

  if (oldPosterPath && newPosterPath !== oldPosterPath) {
    await supabase.storage.from("ARIMORI_posters").remove([oldPosterPath]);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteSchedule(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const posterPath = nullableText(formData, "poster_path");

  const { error } = await supabase.from("ARIMORI_schedules").delete().eq("id", id);
  if (error) return { error: `일정 삭제 실패: ${error.message}` };

  if (posterPath) {
    const { error: storageError } = await supabase.storage.from("ARIMORI_posters").remove([posterPath]);
    if (storageError) {
      revalidatePath("/");
      revalidatePath("/schedule");
      revalidatePath("/admin");
      return { error: `일정은 삭제됐지만 포스터 삭제에 실패했습니다: ${storageError.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  return { error: null };
}
