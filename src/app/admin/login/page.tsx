import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "관리자 로그인" };

export default function AdminLoginPage() {
  return (
    <div className="login-page">
      <section className="login-card">
        <Link href="/" className="mini-brand">아리모리</Link>
        <h1>관리자 로그인</h1>
        <p>공연 일정과 포스터를 관리하는 전용 공간입니다.</p>
        <Suspense fallback={<p>로그인 화면을 준비하고 있습니다...</p>}><LoginForm /></Suspense>
        <p className="login-notice">관리자로 등록된 계정만 접근할 수 있습니다. 공개 회원가입은 제공하지 않습니다.</p>
      </section>
    </div>
  );
}
