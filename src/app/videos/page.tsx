import { Play } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const videos = [
  { title: "2026 여름밤 풍류 — 공연 하이라이트", meta: "아리모리 공식 영상 · 04:28" },
  { title: "찾아가는 문화예술 공연 현장", meta: "공연 기록 · 03:12" },
  { title: "장단으로 만나는 우리 동네 이야기", meta: "아리모리 기획공연 · 05:46" },
];

export const metadata = { title: "공연 영상" };

export default function VideosPage() {
  return (
    <>
      <PageHeader eyebrow="PERFORMANCE FILM" title="공연 영상" description="무대 위의 흥과 따뜻한 순간을 영상으로 다시 만나보세요." />
      <div className="page-wrap">
        <div className="video-list">
          {videos.map((video) => (
            <article className="video-card" key={video.title}>
              <div className="video-card__visual">
                <span className="play-button"><Play size={23} fill="currentColor" /></span>
              </div>
              <h2>{video.title}</h2>
              <p>{video.meta}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
