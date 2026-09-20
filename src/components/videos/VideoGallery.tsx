"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import type { VideoRow } from "@/lib/supabase/videos";

export function VideoGallery({ videos }: { videos: VideoRow[] }) {
  const [selectedVideo, setSelectedVideo] = useState<VideoRow | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedVideo ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedVideo]);

  if (!videos.length) {
    return <div className="video-empty"><Play size={26} /><span>등록된 공연 영상이 없습니다.</span></div>;
  }

  return (
    <>
      <div className="video-list">
        {videos.map((video) => (
          <button className="video-card" key={video.id} type="button" onClick={() => setSelectedVideo(video)}>
            <div className="video-card__visual">
              {/* 유튜브 썸네일은 외부 URL이므로 실제 이미지 요소를 사용한다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`} alt={`${video.title} 영상 썸네일`} loading="lazy" />
              <span className="play-button"><Play size={23} fill="currentColor" /></span>
            </div>
            <h2>{video.title}</h2>
            {video.description && <p>{video.description}</p>}
          </button>
        ))}
      </div>

      {selectedVideo && (
        <div className="video-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedVideo(null)}>
          <section className="video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
            <div className="video-modal__player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtube_id}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="video-modal__content">
              <h2 id="video-modal-title">{selectedVideo.title}</h2>
              {selectedVideo.description && <p>{selectedVideo.description}</p>}
              <button className="secondary-button video-modal__close" type="button" onClick={() => setSelectedVideo(null)}><X size={16} /> 닫기</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
