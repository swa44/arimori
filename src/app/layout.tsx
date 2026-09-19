import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "아리모리", template: "%s | 아리모리" },
  description: "전통을 오늘의 감각으로 잇는 지역 문화예술 공연팀 아리모리입니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <main>{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
