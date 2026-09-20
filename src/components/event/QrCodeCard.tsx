"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

export function QrCodeCard({ value, filename, fileName, label, title, description, showValue = true }: { value: string; filename?: string; fileName?: string; label?: string; title?: string; description?: string; showValue?: boolean }) {
  const heading = title ?? label ?? "QR 코드";
  const downloadName = fileName ?? `${filename ?? "arimori-qr"}.png`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: 320,
      margin: 2,
      color: { dark: "#25241f", light: "#fffdf8" },
      errorCorrectionLevel: "H",
    }).then(() => setError("")).catch(() => setError("QR 코드를 만들지 못했습니다."));
  }, [value]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = downloadName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return <div className="qr-card">
    <div className="qr-card__heading"><QrCode size={19} /><strong>{heading}</strong></div>
    {description && <span className="qr-card__description">{description}</span>}
    <canvas ref={canvasRef} aria-label={heading} />
    {showValue && <p>{value}</p>}
    <button className="secondary-button" type="button" onClick={download}><Download size={16} /> QR 코드 저장</button>
    {error && <span className="form-error" role="alert">{error}</span>}
  </div>;
}
