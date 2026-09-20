"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Camera, Keyboard } from "lucide-react";
import { recordStamp } from "@/app/admin/event-actions";
import { recordStaffStamp } from "@/app/event/actions";

export function StampScanner({ boothId, staffMode = false }: { boothId: string; staffMode?: boolean }) {
  const [state, action, pending] = useActionState(staffMode ? recordStaffStamp : recordStamp, { error: null });
  const [camera, setCamera] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!camera || !videoRef.current) return;
    const reader = new BrowserQRCodeReader();
    let stopped = false;
    let stopCamera: (() => void) | undefined;
    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result && !stopped) { setScannedValue(result.getText()); setCamera(false); }
    }).then((controls) => { stopCamera = () => controls.stop(); if (stopped) controls.stop(); }).catch(() => setCamera(false));
    return () => { stopped = true; stopCamera?.(); };
  }, [camera]);

  return <section className="stamp-scanner">
    <button className="primary-button" type="button" onClick={() => setCamera((value) => !value)}><Camera size={18} /> {camera ? "카메라 닫기" : "QR 카메라 켜기"}</button>
    {camera && <video ref={videoRef} className="stamp-scanner__video" muted playsInline />}
    <form action={action} className="admin-form"><input type="hidden" name="booth_id" value={boothId} />
      <label><span><Keyboard size={15} /> QR 값 직접 입력</span><input name="qr_value" required value={scannedValue} onChange={(event) => setScannedValue(event.target.value)} placeholder="QR 주소 또는 참여 코드" /></label>
      {state.error && <p className="form-message is-error">{state.error}</p>}{state.success && <p className="form-message is-success">{state.success}</p>}
      <button className="secondary-button" disabled={pending}>{pending ? "기록 중…" : "스탬프 기록"}</button>
    </form>
  </section>;
}
