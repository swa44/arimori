"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Camera } from "lucide-react";
import { recordStamp } from "@/app/admin/event-actions";
import { recordStaffStamp } from "@/app/event/actions";

export function StampScanner({ boothId, staffMode = false }: { boothId: string; staffMode?: boolean }) {
  const [state, action, pending] = useActionState(staffMode ? recordStaffStamp : recordStamp, { error: null });
  const [camera, setCamera] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!camera || !videoRef.current) return;
    const reader = new BrowserQRCodeReader();
    let stopped = false;
    let stopCamera: (() => void) | undefined;
    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result && !stopped) {
        stopped = true;
        setScannedValue(result.getText());
        setCamera(false);
        window.requestAnimationFrame(() => formRef.current?.requestSubmit());
      }
    }).then((controls) => { stopCamera = () => controls.stop(); if (stopped) controls.stop(); }).catch(() => setCamera(false));
    return () => { stopped = true; stopCamera?.(); };
  }, [camera]);

  return <section className="stamp-scanner">
    <button className="primary-button" type="button" disabled={pending} onClick={() => setCamera((value) => !value)}><Camera size={18} /> {camera ? "카메라 닫기" : "QR 카메라 켜기"}</button>
    {camera && <video ref={videoRef} className="stamp-scanner__video" muted playsInline />}
    <form ref={formRef} action={action} className="admin-form stamp-scanner__result"><input type="hidden" name="booth_id" value={boothId} /><input type="hidden" name="qr_value" value={scannedValue} readOnly />
      <div className={`stamp-scanner__participant${state.participant ? " has-participant" : ""}`}>{pending ? "참가자 확인 중…" : state.participant ?? "QR을 스캔해 주세요."}</div>
      {state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}
    </form>
  </section>;
}
