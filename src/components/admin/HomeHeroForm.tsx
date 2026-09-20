"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateHomeHero, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

type HomeHeroFormProps = {
  kicker: string;
  title: string;
  subtitle: string;
};

export function HomeHeroForm({ kicker, title, subtitle }: HomeHeroFormProps) {
  const [state, formAction, isPending] = useActionState(updateHomeHero, initialState);

  return <form className="admin-home-form" action={formAction}>
    <label>
      <span>상단 영문</span>
      <input name="home_hero_kicker" defaultValue={kicker} maxLength={60} required />
    </label>
    <label>
      <span>메인 문구</span>
      <input name="home_hero_title" defaultValue={title} maxLength={40} required />
    </label>
    <label>
      <span>하단 문구</span>
      <input name="home_hero_subtitle" defaultValue={subtitle} maxLength={40} required />
    </label>
    <p className="admin-home-form__help">글자 스타일과 배치는 그대로 유지되고 입력한 문구만 홈 화면에 반영됩니다.</p>
    <button className="primary-button" type="submit" disabled={isPending}>
      {isPending && <LoaderCircle className="spin" size={16} />}
      {isPending ? "저장 중" : "문구 저장"}
    </button>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
  </form>;
}
