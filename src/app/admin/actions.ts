"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = {
  error: string | null;
  success?: string;
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

function youtubeValues(formData: FormData) {
  const input = String(formData.get("youtube_url") ?? "").trim();
  if (!input) throw new Error("유튜브 URL을 입력해 주세요.");

  let youtubeId = "";
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    youtubeId = input;
  } else {
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    try {
      const url = new URL(normalized);
      const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

      if (host === "youtu.be") {
        youtubeId = url.pathname.split("/").filter(Boolean)[0] ?? "";
      } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        youtubeId = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? "";
      }
    } catch {
      youtubeId = "";
    }
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    throw new Error("올바른 유튜브 영상 URL인지 확인해 주세요.");
  }

  return {
    youtube_id: youtubeId,
    youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`,
  };
}

function bookingValues(formData: FormData) {
  const bookingType = String(formData.get("booking_type") ?? "");

  if (!(["reservation", "free", "onsite"] as const).includes(bookingType as "reservation" | "free" | "onsite")) {
    throw new Error("예매 방식을 선택해 주세요.");
  }

  if (bookingType !== "reservation") {
    return { booking_type: bookingType, booking_url: null };
  }

  const input = String(formData.get("booking_url") ?? "").trim();
  if (!input) throw new Error("예매 공연은 공연 예매 URL을 입력해 주세요.");

  const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(normalized);
    if (!(["http:", "https:"] as const).includes(url.protocol as "http:" | "https:")) throw new Error();
  } catch {
    throw new Error("공연 예매 URL을 확인해 주세요.");
  }

  return { booking_type: bookingType, booking_url: normalized };
}

function koreaDateTimeToIso(value: string) {
  if (!value) return null;
  return new Date(`${value}:00+09:00`).toISOString();
}

function safeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

export async function requireAdmin() {
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
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("JPG, PNG, WEBP 이미지 파일만 등록할 수 있습니다.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("포스터 파일은 장당 10MB 이하로 등록해 주세요.");

  const path = `${userId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from("ARIMORI_posters")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`포스터 업로드 실패: ${error.message}`);
  return path;
}

async function uploadPosters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  files: File[],
  userId: string,
) {
  if (files.length > 10) throw new Error("포스터는 최대 10장까지 등록할 수 있습니다.");
  const uploaded: string[] = [];
  try {
    for (const file of files) {
      const path = await uploadPoster(supabase, file, userId);
      if (path) uploaded.push(path);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from("ARIMORI_posters").remove(uploaded);
    throw error;
  }
}

function posterFiles(formData: FormData) {
  return formData.getAll("posters").filter((item): item is File => item instanceof File && item.size > 0);
}

function parseStringArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
  } catch {
    return [];
  }
}

function orderedPosterPaths({
  order,
  existingPaths,
  newIds,
  uploadedPaths,
  hasExplicitOrder,
}: {
  order: string[];
  existingPaths: string[];
  newIds: string[];
  uploadedPaths: string[];
  hasExplicitOrder: boolean;
}) {
  if (newIds.length !== uploadedPaths.length || new Set(newIds).size !== newIds.length) {
    throw new Error("새 포스터 순서 정보를 확인할 수 없습니다.");
  }
  if (!hasExplicitOrder) return uploadedPaths.length ? uploadedPaths : existingPaths;

  if (newIds.some((id) => !order.includes(id))) {
    throw new Error("새 포스터 순서 정보가 누락되었습니다.");
  }

  const newPathById = new Map(newIds.map((id, index) => [id, uploadedPaths[index]]));
  const resolved = order.map((token) => {
    if (token.startsWith("existing:")) {
      const index = Number(token.slice("existing:".length));
      return Number.isInteger(index) ? existingPaths[index] : undefined;
    }
    return newPathById.get(token);
  });
  if (resolved.some((path) => !path) || new Set(order).size !== order.length) {
    throw new Error("포스터 순서 정보가 올바르지 않습니다.");
  }
  return resolved as string[];
}

export async function createSchedule(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();
  let uploadedPaths: string[] = [];

  try {
    const files = posterFiles(formData);
    const newIds = parseStringArray(formData.get("new_poster_ids"));
    uploadedPaths = await uploadPosters(supabase, files, user.id);
    const nextPaths = orderedPosterPaths({
      order: parseStringArray(formData.get("poster_order")),
      existingPaths: [],
      newIds,
      uploadedPaths,
      hasExplicitOrder: formData.has("poster_order"),
    });
    const booking = bookingValues(formData);

    const { error } = await supabase.from("ARIMORI_schedules").insert({
      title: String(formData.get("title") ?? "").trim(),
      start_at: koreaDateTimeToIso(String(formData.get("start_at") ?? "")),
      end_at: null,
      location: String(formData.get("location") ?? "").trim(),
      description: nullableText(formData, "description"),
      poster_path: nextPaths[0] ?? null,
      poster_paths: nextPaths,
      map_query: String(formData.get("map_query") ?? "").trim(),
      ...booking,
      category: "공연",
      is_public: true,
      is_cancelled: false,
      is_featured: true,
      created_by: user.id,
    });

    if (error) throw new Error(`일정 등록 실패: ${error.message}`);
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from("ARIMORI_posters").remove(uploadedPaths);
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
  const oldPosterPaths = parseStringArray(formData.get("old_poster_paths"));
  const existingPaths = oldPosterPaths.length ? oldPosterPaths : oldPosterPath ? [oldPosterPath] : [];
  let uploadedPaths: string[] = [];

  try {
    const files = posterFiles(formData);
    const newIds = parseStringArray(formData.get("new_poster_ids"));
    uploadedPaths = await uploadPosters(supabase, files, user.id);
    const nextPaths = orderedPosterPaths({
      order: parseStringArray(formData.get("poster_order")),
      existingPaths,
      newIds,
      uploadedPaths,
      hasExplicitOrder: formData.has("poster_order"),
    });
    const booking = bookingValues(formData);

    const { error } = await supabase
      .from("ARIMORI_schedules")
      .update({
        title: String(formData.get("title") ?? "").trim(),
        start_at: koreaDateTimeToIso(String(formData.get("start_at") ?? "")),
        end_at: null,
        location: String(formData.get("location") ?? "").trim(),
        description: nullableText(formData, "description"),
        poster_path: nextPaths[0] ?? null,
        poster_paths: nextPaths,
        map_query: String(formData.get("map_query") ?? "").trim(),
        ...booking,
        category: "공연",
        is_public: true,
        is_cancelled: formData.get("is_cancelled") === "on",
        is_featured: true,
      })
      .eq("id", id);

    if (error) throw new Error(`일정 수정 실패: ${error.message}`);
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from("ARIMORI_posters").remove(uploadedPaths);
    return actionError(error);
  }

  const keptExistingPaths = new Set(orderedPosterPaths({
    order: parseStringArray(formData.get("poster_order")),
    existingPaths,
    newIds: parseStringArray(formData.get("new_poster_ids")),
    uploadedPaths,
    hasExplicitOrder: formData.has("poster_order"),
  }).filter((path) => existingPaths.includes(path)));
  const removedExistingPaths = existingPaths.filter((path) => !keptExistingPaths.has(path));
  if (removedExistingPaths.length) await supabase.storage.from("ARIMORI_posters").remove(removedExistingPaths);

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteSchedule(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const posterPath = nullableText(formData, "poster_path");
  const storedPosterPaths = parseStringArray(formData.get("poster_paths"));
  const pathsToDelete = [...new Set(storedPosterPaths.length ? storedPosterPaths : posterPath ? [posterPath] : [])];

  const { error } = await supabase.from("ARIMORI_schedules").delete().eq("id", id);
  if (error) return { error: `일정 삭제 실패: ${error.message}` };

  if (pathsToDelete.length) {
    const { error: storageError } = await supabase.storage.from("ARIMORI_posters").remove(pathsToDelete);
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

export async function createVideo(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();

  try {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) throw new Error("영상 제목을 입력해 주세요.");
    const youtube = youtubeValues(formData);

    const { error } = await supabase.from("ARIMORI_videos").insert({
      title,
      description: nullableText(formData, "description"),
      ...youtube,
      display_order: Number(formData.get("display_order") ?? 0) || 0,
      is_public: formData.get("is_public") === "on",
      created_by: user.id,
    });

    if (error) throw new Error(`영상 등록 실패: ${error.message}`);
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/videos");
  revalidatePath("/admin");
  redirect("/admin?tab=videos");
}

export async function updateVideo(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  try {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) throw new Error("영상 제목을 입력해 주세요.");
    const youtube = youtubeValues(formData);

    const { error } = await supabase
      .from("ARIMORI_videos")
      .update({
        title,
        description: nullableText(formData, "description"),
        ...youtube,
        display_order: Number(formData.get("display_order") ?? 0) || 0,
        is_public: formData.get("is_public") === "on",
      })
      .eq("id", id);

    if (error) throw new Error(`영상 수정 실패: ${error.message}`);
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/videos");
  revalidatePath("/admin");
  redirect("/admin?tab=videos");
}

export async function deleteVideo(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("ARIMORI_videos").delete().eq("id", id);
  if (error) return { error: `영상 삭제 실패: ${error.message}` };

  revalidatePath("/videos");
  revalidatePath("/admin");
  return { error: null };
}

function newsValues(formData: FormData) {
  const badge = String(formData.get("badge") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!badge || !title || !content) throw new Error("뱃지 문구와 제목, 내용을 모두 입력해 주세요.");
  if (badge.length > 20) throw new Error("뱃지 문구는 20자 이내로 입력해 주세요.");
  if (title.length > 160) throw new Error("제목은 160자 이내로 입력해 주세요.");
  if (content.length > 5000) throw new Error("내용은 5,000자 이내로 입력해 주세요.");
  return { badge, title, content };
}

export async function createNews(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();
  try {
    const { error } = await supabase.from("ARIMORI_news").insert({ ...newsValues(formData), created_by: user.id });
    if (error) throw new Error(`소식 등록 실패: ${error.message}`);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?tab=news");
}

export async function updateNews(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  try {
    if (!id) throw new Error("수정할 소식을 확인할 수 없습니다.");
    const { error } = await supabase.from("ARIMORI_news").update(newsValues(formData)).eq("id", id);
    if (error) throw new Error(`소식 수정 실패: ${error.message}`);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?tab=news");
}

export async function deleteNews(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "삭제할 소식을 확인할 수 없습니다." };
  const { error } = await supabase.from("ARIMORI_news").delete().eq("id", id);
  if (error) return { error: `소식 삭제 실패: ${error.message}` };
  revalidatePath("/");
  revalidatePath("/admin");
  return { error: null };
}

export async function updateInquirySettings(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const notificationPhone = String(formData.get("notification_phone") ?? "").replace(/\D/g, "");

  if (notificationPhone.length < 8 || notificationPhone.length > 15) {
    return { error: "문자를 받을 전화번호를 확인해 주세요." };
  }

  const { error } = await supabase.from("ARIMORI_inquiry_settings").upsert({
    id: true,
    notification_phone: notificationPhone,
  });

  if (error) return { error: `수신번호 저장 실패: ${error.message}` };

  revalidatePath("/admin");
  return { error: null, success: "수신번호를 저장했습니다." };
}

export async function updateInquiryStatus(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!(["new", "in_progress", "completed"] as const).includes(status as "new" | "in_progress" | "completed")) {
    return { error: "문의 처리 상태를 확인해 주세요." };
  }

  const { error } = await supabase.from("ARIMORI_inquiries").update({ status }).eq("id", id);
  if (error) return { error: `문의 상태 저장 실패: ${error.message}` };

  revalidatePath("/admin");
  revalidatePath(`/admin/inquiry/${id}`);
  return { error: null };
}

export async function deleteInquiry(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "삭제할 문의를 확인할 수 없습니다." };

  const { error } = await supabase.from("ARIMORI_inquiries").delete().eq("id", id);
  if (error) return { error: `공연문의 삭제 실패: ${error.message}` };

  revalidatePath("/admin");
  revalidatePath(`/admin/inquiry/${id}`);
  return { error: null };
}

export async function updateHomeHero(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const kicker = String(formData.get("home_hero_kicker") ?? "").trim();
  const title = String(formData.get("home_hero_title") ?? "").trim();
  const subtitle = String(formData.get("home_hero_subtitle") ?? "").trim();

  if (!kicker || !title || !subtitle) return { error: "세 문구를 모두 입력해 주세요." };
  if (kicker.length > 60 || title.length > 40 || subtitle.length > 40) {
    return { error: "영문은 60자, 한글 문구는 각각 40자 이내로 입력해 주세요." };
  }

  const { error } = await supabase.from("ARIMORI_site_settings").upsert({
    id: true,
    home_hero_kicker: kicker,
    home_hero_title: title,
    home_hero_subtitle: subtitle,
  });
  if (error) return { error: `홈 문구 저장 실패: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/admin");
  return { error: null, success: "홈 화면 문구를 저장했습니다." };
}

export async function updateAboutImage(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase, user } = await requireAdmin();
  const image = formData.get("about_image");
  if (!(image instanceof File) || !image.size) return { error: "소개 사진을 선택해 주세요." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) return { error: "JPG, PNG, WEBP 이미지 파일만 등록할 수 있습니다." };
  if (image.size > 10 * 1024 * 1024) return { error: "소개 사진은 10MB 이하로 등록해 주세요." };

  const path = `${user.id}/${safeFileName(image.name)}`;
  const { data: current } = await supabase.from("ARIMORI_site_settings").select("about_image_path").eq("id", true).maybeSingle();
  const oldPath = current?.about_image_path as string | null;
  const { error: uploadError } = await supabase.storage.from("ARIMORI_site_images").upload(path, image, { contentType: image.type, upsert: false });
  if (uploadError) return { error: `소개 사진 업로드 실패: ${uploadError.message}` };

  const { error } = await supabase.from("ARIMORI_site_settings").upsert({ id: true, about_image_path: path });
  if (error) {
    await supabase.storage.from("ARIMORI_site_images").remove([path]);
    return { error: `소개 사진 저장 실패: ${error.message}` };
  }
  if (oldPath && oldPath !== path) await supabase.storage.from("ARIMORI_site_images").remove([oldPath]);

  revalidatePath("/about");
  revalidatePath("/admin");
  return { error: null, success: "소개 사진을 저장했습니다." };
}

export async function deleteAboutImage(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const path = nullableText(formData, "about_image_path");
  const { error } = await supabase.from("ARIMORI_site_settings").upsert({ id: true, about_image_path: null });
  if (error) return { error: `소개 사진 삭제 실패: ${error.message}` };
  if (path) await supabase.storage.from("ARIMORI_site_images").remove([path]);

  revalidatePath("/about");
  revalidatePath("/admin");
  return { error: null, success: "소개 사진을 삭제했습니다." };
}
