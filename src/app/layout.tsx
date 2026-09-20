import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import "./globals.css";

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-arimori-serif",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.ARIMORI_SITE_URL ?? "https://ari-mori.com"),
  title: { default: "아리모리", template: "%s | 아리모리" },
  description: "전통을 오늘의 감각으로 잇는 지역 문화예술 공연팀 아리모리입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "아리모리앙상블",
    title: "아리모리앙상블",
    description: "전통악기와 서양악기가 어우러지는 퓨전국악 앙상블",
    images: [{
      url: "/images/arimori-og.jpg",
      width: 1200,
      height: 630,
      alt: "아리모리앙상블 단체 사진",
      type: "image/jpeg",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "아리모리앙상블",
    description: "전통악기와 서양악기가 어우러지는 퓨전국악 앙상블",
    images: ["/images/arimori-og.jpg"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "아리모리",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/arimori-192.png",
    apple: "/icons/arimori-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={notoSerifKr.variable}>
        <div className="site-shell">
          <main>{children}</main>
          <PwaInstallPrompt />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
