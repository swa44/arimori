/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";
import { deleteAboutStageImage, registerAboutStageImages, reorderAboutStageImages, type AdminActionState } from "@/app/admin/actions";
import { aboutStages, type AboutStageImage, type AboutStageKey } from "@/data/about-stages";
import { optimizeImageForWeb } from "@/lib/images/optimize";
import { createClient } from "@/lib/supabase/client";

type ImageWithUrl = AboutStageImage & { url: string };
const initialState: AdminActionState = { error: null };

function DeleteStageImageButton({ image }: { image: ImageWithUrl }) {
  const [state, action, pending] = useActionState(deleteAboutStageImage, initialState);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("이 사진을 삭제할까요?")) event.preventDefault(); }}><input type="hidden" name="id" value={image.id} /><button type="submit" aria-label="사진 삭제" disabled={pending}>{pending ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button>{state.error && <span className="form-error">{state.error}</span>}</form>;
}

function StageImageSection({ stageKey, title, images }: { stageKey: AboutStageKey; title: string; images: ImageWithUrl[] }) {
  const router = useRouter();
  const [ordered, setOrdered] = useState(images);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<AdminActionState>(initialState);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0, percent: 0, label: "" });
  const [orderState, orderAction, ordering] = useActionState(reorderAboutStageImages, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) return;
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, [uploading]);

  function assignFiles(files: FileList) {
    const accepted = [...files].filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)).slice(0, 10);
    setSelectedFiles(accepted);
    setUploadState(initialState);
  }

  async function uploadSelectedImages() {
    if (!selectedFiles.length || uploading) return;
    if (images.length + selectedFiles.length > 20) return setUploadState({ error: "무대별 사진은 최대 20장까지 등록할 수 있습니다." });

    const supabase = createClient();
    const uploadedPaths: string[] = [];
    setUploading(true);
    setUploadState(initialState);
    setUploadProgress({ completed: 0, total: selectedFiles.length, percent: 0, label: "사진을 준비하고 있습니다." });

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("관리자 로그인을 다시 확인해 주세요.");

      for (const [index, sourceFile] of selectedFiles.entries()) {
        setUploadProgress({ completed: index, total: selectedFiles.length, percent: Math.round((index / selectedFiles.length) * 90), label: `${sourceFile.name} 변환·업로드 중` });
        const file = await optimizeImageForWeb(sourceFile);
        const path = `about-stages/${stageKey}/${user.id}/${file.name}`;
        const { error } = await supabase.storage.from("ARIMORI_site_images").upload(path, file, { contentType: "image/webp", upsert: false });
        if (error) throw new Error(`${sourceFile.name} 업로드 실패: ${error.message}`);
        uploadedPaths.push(path);
        setUploadProgress({ completed: index + 1, total: selectedFiles.length, percent: Math.round(((index + 1) / selectedFiles.length) * 90), label: `${index + 1}장 업로드 완료` });
      }

      setUploadProgress({ completed: selectedFiles.length, total: selectedFiles.length, percent: 95, label: "사진 정보를 저장하고 있습니다." });
      const formData = new FormData();
      formData.set("stage_key", stageKey);
      formData.set("image_paths", JSON.stringify(uploadedPaths));
      const result = await registerAboutStageImages(initialState, formData);
      if (result.error) throw new Error(result.error);

      setUploadProgress({ completed: selectedFiles.length, total: selectedFiles.length, percent: 100, label: "등록을 완료했습니다." });
      setUploadState(result);
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from("ARIMORI_site_images").remove(uploadedPaths);
      setUploadState({ error: error instanceof Error ? error.message : "사진을 등록하지 못했습니다." });
    } finally {
      setUploading(false);
    }
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
    <div className="admin-stage-upload"><label className={`poster-dropzone${dropActive ? " is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDropActive(true); }} onDragOver={(event) => { event.preventDefault(); setDropActive(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropActive(false); }} onDrop={(event) => { event.preventDefault(); setDropActive(false); assignFiles(event.dataTransfer.files); }}><ImagePlus size={24} /><span><strong>{selectedFiles.length ? `${selectedFiles.length}장 선택됨` : "여러 사진을 끌어다 놓으세요"}</strong><small>한 번에 최대 10장 · 가로 최대 800px · 세로 비율 유지 · WebP 자동 변환</small></span><input ref={inputRef} className="poster-file-input" name="stage_images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { if (event.target.files) assignFiles(event.target.files); }} /></label><button type="button" className="primary-button" disabled={uploading || !selectedFiles.length} onClick={uploadSelectedImages}>{uploading ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}{uploading ? "등록 중…" : `${selectedFiles.length || ""}장 사진 등록`}</button>{uploadState.error && <p className="form-error">{uploadState.error}</p>}{uploadState.success && <p className="form-success">{uploadState.success}</p>}</div>
    {uploading && <div className="admin-upload-progress" role="status" aria-live="polite"><div className="admin-upload-progress__card"><LoaderCircle className="spin" size={30} /><strong>사진을 업로드하고 있습니다.</strong><p>{uploadProgress.label}</p><div><span style={{ width: `${uploadProgress.percent}%` }} /></div><b>{uploadProgress.completed} / {uploadProgress.total} · {uploadProgress.percent}%</b><small>완료될 때까지 화면을 닫지 마세요.</small></div></div>}
  </section>;
}

export function AboutStageImageManager({ images }: { images: ImageWithUrl[] }) {
  return <div className="admin-stage-image-manager">{aboutStages.map((stage) => {
    const stageImages = images.filter((image) => image.stage_key === stage.key);
    return <StageImageSection stageKey={stage.key} title={stage.title} images={stageImages} key={`${stage.key}:${stageImages.map((image) => image.id).join(",")}`} />;
  })}</div>;
}
