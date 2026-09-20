import Link from "next/link";
import { StampProgramForm } from "@/components/admin/EventForms";
export const metadata = { title: "스탬프 프로그램 만들기" };
export default function Page() { return <div className="admin-shell"><div className="admin-container admin-editor"><Link href="/admin?tab=events" className="admin-back">← 이벤트 관리</Link><div className="admin-heading"><div><h1>새 스탬프 프로그램</h1><p>기간과 필요한 스탬프 수를 먼저 정해 주세요.</p></div></div><StampProgramForm /></div></div>; }
