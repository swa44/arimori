"use server";

import { after } from "next/server";
import { sendInquiryNotification } from "@/lib/bizgo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InquiryActionState = {
  error: string | null;
  success: boolean;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function adminOrigin() {
  return process.env.ARIMORI_ADMIN_URL?.trim().replace(/\/$/, "") || "https://admin.ari-mori.com";
}

async function notifyAdmin(inquiryId: string) {
  const admin = createAdminClient();
  const { data: settings, error: settingsError } = await admin
    .from("ARIMORI_inquiry_settings")
    .select("notification_phone")
    .eq("id", true)
    .maybeSingle();

  if (settingsError) throw new Error(`문의 알림 설정 조회 실패: ${settingsError.message}`);
  if (!settings?.notification_phone) {
    await admin.from("ARIMORI_inquiries").update({ sms_status: "not_configured" }).eq("id", inquiryId);
    return;
  }

  try {
    await sendInquiryNotification({
      inquiryId,
      recipient: settings.notification_phone,
      detailUrl: `${adminOrigin()}/admin/inquiry/${inquiryId}`,
    });
    await admin
      .from("ARIMORI_inquiries")
      .update({ sms_status: "sent", sms_sent_at: new Date().toISOString(), sms_error: null })
      .eq("id", inquiryId);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "문자 발송 실패";
    await admin.from("ARIMORI_inquiries").update({ sms_status: "failed", sms_error: message }).eq("id", inquiryId);
    console.error("문의 알림 문자 발송 실패", message);
  }
}

export async function createInquiry(_state: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  if (value(formData, "website")) return { error: null, success: true };

  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const email = value(formData, "email");
  const message = value(formData, "message");
  const privacyAgreed = formData.get("privacy_agreed") === "on";

  if (name.length < 2 || name.length > 50) return { error: "이름을 2자 이상 50자 이하로 입력해 주세요.", success: false };
  if (!/^[0-9+()\-\s]{8,20}$/.test(phone)) return { error: "연락처를 확인해 주세요.", success: false };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "이메일 주소를 확인해 주세요.", success: false };
  if (message.length < 10 || message.length > 2000) return { error: "문의 내용을 10자 이상 2,000자 이하로 입력해 주세요.", success: false };
  if (!privacyAgreed) return { error: "개인정보 수집 및 이용에 동의해 주세요.", success: false };

  const inquiryId = crypto.randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("ARIMORI_inquiries").insert({
    id: inquiryId,
    name,
    phone,
    email,
    message,
    privacy_agreed: true,
    status: "new",
  });

  if (error) {
    console.error("문의 접수 실패", error);
    return { error: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.", success: false };
  }

  after(async () => {
    try {
      await notifyAdmin(inquiryId);
    } catch (notificationError) {
      console.error("문의 알림 처리 실패", notificationError);
    }
  });

  return { error: null, success: true };
}
