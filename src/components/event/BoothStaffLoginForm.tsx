"use client";

import { useActionState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { loginBoothStaff, type EventActionState } from "@/app/event/actions";

const initialState: EventActionState = { error: null };

export function BoothStaffLoginForm({ programId, slug, booths }: { programId: string; slug: string; booths: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(loginBoothStaff, initialState);
  return <form className="event-form" action={action}>
    <input type="hidden" name="program_id" value={programId} /><input type="hidden" name="slug" value={slug} />
    <label><span>담당 부스</span><select name="booth_id" required defaultValue=""><option value="" disabled>내가 맡은 부스를 선택하세요</option>{booths.map((booth) => <option value={booth.id} key={booth.id}>{booth.name}</option>)}</select></label>
    <label><span>담당자 인증코드</span><input name="access_code" type="password" minLength={6} required autoComplete="current-password" placeholder="관리자에게 받은 코드" /></label>
    <button className="primary-button event-submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={17} /> : <LogIn size={17} />}{pending ? "확인 중..." : "담당 부스로 로그인"}</button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
  </form>;
}
