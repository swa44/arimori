const adminManifest = {
  id: "/admin",
  name: "아리모리 관리",
  short_name: "아리모리 관리",
  description: "아리모리 공연과 콘텐츠를 관리하는 전용 앱",
  start_url: "/admin",
  scope: "/admin",
  display: "standalone",
  orientation: "portrait",
  background_color: "#f1efe9",
  theme_color: "#588d94",
  lang: "ko-KR",
  categories: ["business", "productivity"],
  icons: [
    { src: "/icons/arimori-maskable-v2-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icons/arimori-maskable-v2-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET() {
  return new Response(JSON.stringify(adminManifest), {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}
