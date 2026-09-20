import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "아리모리",
    short_name: "아리모리",
    description: "전통을 오늘의 감각으로 잇는 지역 문화예술 공연팀 아리모리",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1e7",
    theme_color: "#889050",
    lang: "ko-KR",
    categories: ["entertainment", "music", "lifestyle"],
    icons: [
      { src: "/icons/arimori-maskable-v2-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/arimori-maskable-v2-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "공연 일정", short_name: "일정", url: "/schedule", icons: [{ src: "/icons/arimori-192.png", sizes: "192x192" }] },
      { name: "공연 문의", short_name: "문의", url: "/contact", icons: [{ src: "/icons/arimori-192.png", sizes: "192x192" }] },
    ],
  };
}
