import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNavigationFeedback } from "@/components/admin/AdminNavigationFeedback";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "아리모리 관리",
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <AdminNavigationFeedback />
      </Suspense>
    </>
  );
}
