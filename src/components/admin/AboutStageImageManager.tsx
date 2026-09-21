/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useRef, useState } from "react";
import { GripVertical, ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";
import { deleteAboutStageImage, reorderAboutStageImages, uploadAboutStageImages, type AdminActionState } from "@/app/admin/actions";
import { aboutStages, type AboutStageImage, type AboutStageKey } from "@/data/about-stages";

type ImageWithUrl = AboutStageImage & { url: string };
const initialState: AdminActionState = { error: null };

function DeleteStageImageButton({ image }: { image: ImageWithUrl }) {
  const [state, action, pending] = useActionState(deleteAboutStageImage, initialState);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("이 사진을 삭제할까요?")) event.preventDefault(); }}><input type="hidden" name="id" value={image.id} /><button type="submit" aria-label="사진 삭제" disabled={pending}>{pending ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button>{state.error && <span className="form-error">{state.error}</span>}</form>;
}

function StageImageSection({ stageKey, title, images }: { stageKey: AboutStageKey; title: string; images: ImageWithUrl[] }) {
  const [ordered, setOrdered] = useState(images);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [uploadState, uploadAction, uploading] = useActionState(uploadAboutStageImages, initialState);
  const [orderState, orderAction, ordering] = useActionState(reorderAboutStageImages, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  function assignFiles(files: FileList) {
    if (!inputRef.current) return;
    const accepted = [...files].filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)).slice(0, 10);
    const transfer = new DataTransfer();
    accepted.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
    setFileCount(accepted.length);
  }

  return <section className="admin-stage-images">
    <header><div><h2>{title}</h2><p>등록된 사진 {images.length}장</p></div></header>
    {ordered.length > 0 && <div className="admin-stage-image-grid">{ordered.map((image) => <article draggable key={image.id} onDragStart={() => setDraggingId(image.id)} onDragEnd={() => setDraggingId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
      event.preventDefault();
      if (!draggingId || draggingId === image.id) return;
      setOrdered((current) => {
        const next = [...current]; const from = next.findIndex((item) => item.id === draggingId); const to = next.findIndex((item) => item.id === image.id);
        if (from < 0 || to < 0) return current;
        const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next;
      });
    }}><img src={image.url} alt="" /><span><GripVertical size={15} /></span><DeleteStageImageButton image={image} /></article>)}</div>}
    {ordered.length > 1 && <form action={orderAction} className="admin-stage-order-form"><input type="hidden" name="stage_key" value={stageKey} /><input type="hidden" name="image_order" value={JSON.stringify(ordered.map((image) => image.id))} /><button className="secondary-button" disabled={ordering}>{ordering ? "저장 중…" : "드래그 순서 저장"}</button>{orderState.error && <p className="form-error">{orderState.error}</p>}{orderState.success && <p className="form-success">{orderState.success}</p>}</form>}
    <form action={uploadAction} className="admin-stage-upload" onSubmit={() => setFileCount(0)}><input type="hidden" name="stage_key" value={stageKey} /><label className={`poster-dropzone${dropActive ? " is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDropActive(true); }} onDragOver={(event) => { event.preventDefault(); setDropActive(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropActive(false); }} onDrop={(event) => { event.preventDefault(); setDropActive(false); assignFiles(event.dataTransfer.files); }}><ImagePlus size={24} /><span><strong>여러 사진을 끌어다 놓으세요</strong><small>또는 클릭해서 선택 · 한 번에 최대 10장</small></span><input ref={inputRef} className="poster-file-input" name="stage_images" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => { if (event.target.files) setFileCount(event.target.files.length); }} /></label><button className="primary-button" disabled={uploading || !fileCount}>{uploading ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}{uploading ? "등록 중…" : `${fileCount || ""}장 사진 등록`}</button>{uploadState.error && <p className="form-error">{uploadState.error}</p>}{uploadState.success && <p className="form-success">{uploadState.success}</p>}</form>
  </section>;
}

export function AboutStageImageManager({ images }: { images: ImageWithUrl[] }) {
  return <div className="admin-stage-image-manager">{aboutStages.map((stage) => {
    const stageImages = images.filter((image) => image.stage_key === stage.key);
    return <StageImageSection stageKey={stage.key} title={stage.title} images={stageImages} key={`${stage.key}:${stageImages.map((image) => image.id).join(",")}`} />;
  })}</div>;
}
