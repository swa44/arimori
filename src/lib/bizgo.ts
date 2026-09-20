import "server-only";

type BizgoResponse = {
  common?: { authCode?: string; authResult?: string };
  data?: { code?: string; result?: string };
};

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function sendInquiryNotification({
  inquiryId,
  recipient,
  detailUrl,
}: {
  inquiryId: string;
  recipient: string;
  detailUrl: string;
}) {
  const apiKey = process.env.ARIMORI_BIZGO_API_KEY;
  const sender = phoneDigits(process.env.ARIMORI_BIZGO_SENDER_NUMBER ?? "");
  const to = phoneDigits(recipient);

  if (!apiKey || !sender) {
    throw new Error("Bizgo API 키 또는 발신번호가 설정되지 않았습니다.");
  }
  if (sender.length < 8 || to.length < 8) {
    throw new Error("Bizgo 발신번호 또는 문의 수신번호를 확인해 주세요.");
  }

  const response = await fetch("https://mars.ibapi.kr/api/comm/v1/send/omni", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageFlow: [{
        mms: {
          from: sender,
          title: "아리모리 공연문의",
          text: `아리모리앙상블 공연문의가 접수되었습니다.\n${detailUrl}`,
        },
      }],
      destinations: [{ to }],
      ref: inquiryId,
      idempotencyKey: `arimori-inquiry-${inquiryId}`,
      idempotencyTtl: 86400,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json().catch(() => null) as BizgoResponse | null;
  if (!response.ok || result?.common?.authCode !== "A000" || result?.data?.code !== "A000") {
    throw new Error(result?.data?.result ?? result?.common?.authResult ?? `Bizgo 요청 실패 (${response.status})`);
  }
}
