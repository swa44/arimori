const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function createClientImageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function optimizeImageForWeb(file: File, maxWidth = 800) {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) throw new Error("JPG, PNG, WEBP 이미지 파일만 등록할 수 있습니다.");
  if (file.size > 10 * 1024 * 1024) throw new Error("이미지는 장당 10MB 이하로 등록해 주세요.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
      image.src = objectUrl;
    });

    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 변환을 시작하지 못했습니다.");
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error(`${file.name} WebP 변환에 실패했습니다.`)),
        "image/webp",
        0.82,
      );
    });

    return new File([blob], `${createClientImageId()}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
