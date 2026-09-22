"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const dismissKey = isAdmin ? "arimori-admin-install-dismissed" : "arimori-install-dismissed";
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(dismissKey, "true");
  }, [dismissKey]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone || sessionStorage.getItem(dismissKey)) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const iosFrame = ios
      ? window.requestAnimationFrame(() => {
          setIsIos(true);
          setDismissed(false);
        })
      : null;

    function capturePrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", dismiss);
    return () => {
      if (iosFrame) window.cancelAnimationFrame(iosFrame);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", dismiss);
    };
  }, [dismiss, dismissKey]);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setInstallPrompt(null);
  }

  if (dismissed || (!installPrompt && !isIos)) return null;

  return (
    <aside className="install-prompt" aria-label={isAdmin ? "아리모리 관리 앱 설치 안내" : "아리모리 앱 설치 안내"}>
      <span className="install-prompt__icon">{isIos ? <Share size={18} /> : <Download size={18} />}</span>
      <div>
        <strong>{isAdmin ? "아리모리 관리 앱으로 보기" : "아리모리 앱으로 보기"}</strong>
        <p>{isIos
          ? "공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요."
          : isAdmin
            ? "관리자 화면을 홈 화면에서 바로 여세요."
            : "홈 화면에 설치하고 빠르게 만나보세요."}</p>
      </div>
      {!isIos && <button className="install-prompt__action" onClick={install}>설치</button>}
      <button className="install-prompt__close" onClick={dismiss} aria-label="설치 안내 닫기"><X size={17} /></button>
    </aside>
  );
}
