"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { createInquiry, type InquiryActionState } from "@/app/contact/actions";

const initialState: InquiryActionState = { error: null, success: false };

export function InquiryForm() {
  const [state, formAction, isPending] = useActionState(createInquiry, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
    submittedRef.current = false;
  }, [state]);

  return (
    <section className="inquiry-section" aria-label="공연 문의 접수 양식">
      <form
        ref={formRef}
        action={formAction}
        className="inquiry-form"
        onInvalidCapture={() => {
          submittedRef.current = false;
          setClientError("누락된 항목을 기입하고 개인정보 수집 및 이용에 동의해 주세요.");
        }}
        onInput={() => setClientError(null)}
        onSubmit={(event) => {
          setClientError(null);
          if (submittedRef.current) {
            event.preventDefault();
            return;
          }
          submittedRef.current = true;
        }}
      >
        <div className="inquiry-honeypot" aria-hidden="true">
          <label htmlFor="website">웹사이트</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="field">
          <label htmlFor="inquiry-name">이름 *</label>
          <input id="inquiry-name" name="name" autoComplete="name" required minLength={2} maxLength={50} />
        </div>

        <div className="field">
          <label htmlFor="inquiry-phone">연락처 *</label>
          <input id="inquiry-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" required minLength={8} maxLength={20} />
        </div>

        <div className="field">
          <label htmlFor="inquiry-email">이메일 *</label>
          <input id="inquiry-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} />
        </div>

        <div className="field">
          <label htmlFor="inquiry-message">문의 내용 *</label>
          <textarea id="inquiry-message" name="message" rows={7} required minLength={10} maxLength={2000} placeholder="행사 일정, 장소, 예상 관객과 원하시는 공연 내용을 알려주세요." />
        </div>

        <div className="privacy-consent">
          <strong>개인정보 수집 및 이용 안내</strong>
          <dl>
            <div><dt>수집 항목</dt><dd>이름, 연락처, 이메일, 문의 내용</dd></div>
            <div><dt>수집 목적</dt><dd>공연 문의 확인 및 답변</dd></div>
            <div><dt>보유 기간</dt><dd>문의 처리 완료 후 1년</dd></div>
          </dl>
          <p>동의를 거부할 수 있으나, 동의하지 않으면 온라인 문의 접수가 어렵습니다.</p>
          <label><input name="privacy_agreed" type="checkbox" required /> 개인정보 수집 및 이용에 동의합니다.</label>
        </div>

        <button className="primary-button inquiry-submit" type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
          {isPending ? "접수 중..." : "문의 접수하기"}
        </button>

        {(clientError || state.error) && <p className="form-error inquiry-result" role="alert">{clientError ?? state.error}</p>}
        {state.success && <p className="inquiry-result is-success" role="status"><CheckCircle2 size={18} /> 문의가 접수되었습니다. 확인 후 연락드리겠습니다.</p>}
      </form>
    </section>
  );
}
