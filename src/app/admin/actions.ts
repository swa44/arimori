"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

async function uploadPoster(file: File, userId: string) {
  if (!file.size) return null;

  const { supabase } = await requireAdmin();
  const path = `${userId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from("ARIMORI_posters")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`포스터 업로드 실패: ${error.message}`);
  return path;
}

export async function createSchedule(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const poster = formData.get("poster");
  const posterPath = poster instanceof File ? await uploadPoster(poster, user.id) : null;

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

  if (error) {
    if (posterPath) await supabase.storage.from("ARIMORI_posters").remove([posterPath]);
    throw new Error(`일정 등록 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSchedule(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const oldPosterPath = nullableText(formData, "old_poster_path");
  const poster = formData.get("poster");
  const newPosterPath = poster instanceof File && poster.size
    ? await uploadPoster(poster, user.id)
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

  if (error) {
    if (newPosterPath && newPosterPath !== oldPosterPath) {
      await supabase.storage.from("ARIMORI_posters").remove([newPosterPath]);
    }
    throw new Error(`일정 수정 실패: ${error.message}`);
  }

  if (oldPosterPath && newPosterPath !== oldPosterPath) {
    await supabase.storage.from("ARIMORI_posters").remove([oldPosterPath]);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const posterPath = nullableText(formData, "poster_path");

  const { error } = await supabase.from("ARIMORI_schedules").delete().eq("id", id);
  if (error) throw new Error(`일정 삭제 실패: ${error.message}`);

  if (posterPath) await supabase.storage.from("ARIMORI_posters").remove([posterPath]);

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
}
