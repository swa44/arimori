import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export const metadata = { title: "관리자 로그인" };

export default function AdminLoginPage() {
  return (
    <div className="login-page">
      <section className="login-card">
        <Link href="/" className="mini-brand">아리모리</Link>
        <h1>관리자 로그인</h1>
        <p>공연 일정과 포스터를 관리하는 전용 공간입니다.</p>
        <form>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" autoComplete="email" placeholder="admin@example.com" disabled />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" autoComplete="current-password" placeholder="비밀번호 입력" disabled />
          </div>
          <button className="primary-button" type="button" disabled><LockKeyhole size={16} /> 로그인</button>
        </form>
        <p className="login-notice">Supabase Auth 연동 후 활성화됩니다. 공개 회원가입은 제공하지 않습니다.</p>
      </section>
    </div>
  );
}
