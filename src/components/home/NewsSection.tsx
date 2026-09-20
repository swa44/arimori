"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { NewsRow } from "@/lib/supabase/news";

export function NewsSection({ news }: { news: NewsRow[] }) {
  const [selectedNews, setSelectedNews] = useState<NewsRow | null>(null);

  useEffect(() => {
    if (!selectedNews) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedNews(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedNews]);

  return <>
    <section className="home-section">
      <div className="news-list">
        {news.slice(0, 3).map((item) => (
          <button className="news-item" type="button" key={item.id} onClick={() => setSelectedNews(item)}>
            <span className="tag tag--teal">{item.badge}</span>
            <h3>{item.title}</h3>
            <ChevronRight size={16} color="#99938a" />
          </button>
        ))}
        {!news.length && <p className="news-empty">등록된 소식이 없습니다.</p>}
      </div>
    </section>

    {selectedNews && <div className="news-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setSelectedNews(null);
    }}>
      <section className="news-modal" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
        <header className="news-modal__header">
          <div><span>NEWS &amp; STORIES</span><h2 id="news-modal-title">아리모리 소식</h2></div>
          <button type="button" onClick={() => setSelectedNews(null)} aria-label="소식 닫기"><X size={21} /></button>
        </header>
        <div className="news-modal__list">
          <article>
            <span className="tag tag--teal">{selectedNews.badge}</span>
            <h3>{selectedNews.title}</h3>
            <p>{selectedNews.content}</p>
          </article>
        </div>
        <button className="secondary-button news-modal__close" type="button" onClick={() => setSelectedNews(null)}>닫기</button>
      </section>
    </div>}
  </>;
}
