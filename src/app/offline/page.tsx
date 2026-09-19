import Link from "next/link";
import { RefreshCw, WifiOff } from "lucide-react";

export const metadata = { title: "오프라인" };

export default function OfflinePage() {
  return (
    <div className="offline-page">
      <div className="offline-card">
        <span className="offline-icon"><WifiOff size={30} /></span>
        <p className="eyebrow">OFFLINE</p>
        <h1 className="display-serif">인터넷 연결을<br />확인해 주세요</h1>
        <p>연결이 복구되면 아리모리의 최신 공연 소식을 다시 확인할 수 있어요.</p>
        <Link href="/" className="primary-button"><RefreshCw size={16} /> 다시 시도</Link>
      </div>
    </div>
  );
}
