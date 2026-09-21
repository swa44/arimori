/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function StagePhotoGallery({ title, images }: { title: string; images: Array<{ id: string; url: string }> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setSelected((current) => current === null ? null : Math.max(0, current - 1));
      if (event.key === "ArrowRight") setSelected((current) => current === null ? null : Math.min(images.length - 1, current + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [images.length, selected]);

  if (!images.length) return null;
  return <>
    <div className={`stage-photo-strip${images.length === 1 ? " is-single" : ""}`} aria-label={`${title} 사진 ${images.length}장`}>{images.map((image, index) => <button type="button" onClick={() => setSelected(index)} key={image.id}><img src={image.url} alt={`${title} 활동 사진 ${index + 1}`} loading="lazy" /><span>{index + 1} / {images.length}</span></button>)}</div>
    {selected !== null && <div className="stage-gallery-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="stage-gallery-modal" role="dialog" aria-modal="true" aria-label={`${title} 사진 보기`} onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
      const start = touchStartX.current; const end = event.changedTouches[0]?.clientX; touchStartX.current = null;
      if (start == null || end == null || Math.abs(start - end) < 45) return;
      setSelected((current) => current === null ? null : Math.max(0, Math.min(images.length - 1, current + (start > end ? 1 : -1))));
    }}><header><strong>{title}</strong><span>{selected + 1} / {images.length}</span><button type="button" onClick={() => setSelected(null)} aria-label="사진 닫기"><X size={20} /></button></header><div className="stage-gallery-modal__image"><img src={images[selected].url} alt={`${title} 활동 사진 ${selected + 1}`} /></div>{images.length > 1 && <><button className="stage-gallery-modal__arrow is-prev" type="button" disabled={selected === 0} onClick={() => setSelected((current) => current === null ? null : Math.max(0, current - 1))} aria-label="이전 사진"><ChevronLeft size={25} /></button><button className="stage-gallery-modal__arrow is-next" type="button" disabled={selected === images.length - 1} onClick={() => setSelected((current) => current === null ? null : Math.min(images.length - 1, current + 1))} aria-label="다음 사진"><ChevronRight size={25} /></button></>}</section></div>}
  </>;
}
