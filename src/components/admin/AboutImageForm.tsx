/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { deleteAboutImage, updateAboutImage, type AdminActionState } from "@/app/admin/actions";
import { optimizeImageForWeb } from "@/lib/images/optimize";

const initialState: AdminActionState = { error: null };

export function AboutImageForm({ imagePath, imageUrl }: { imagePath: string | null; imageUrl: string | null }) {
  const [saveState, saveAction, isSaving] = useActionState(updateAboutImage, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteAboutImage, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [clientError, setClientError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function selectFile(file: File) {
    if (!inputRef.current || isOptimizing) return;
    setClientError("");
    setIsOptimizing(true);
    try {
      const optimized = await optimizeImageForWeb(file);
      const transfer = new DataTransfer();
      transfer.items.add(optimized);
      inputRef.current.files = transfer.files;
      setPreviewUrl((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return URL.createObjectURL(optimized);
      });
    } catch (error) {
      inputRef.current.value = "";
      setClientError(error instanceof Error ? error.message : "소개 사진을 최적화하지 못했습니다.");
    } finally {
      setIsOptimizing(false);
    }
  }

  return <section className="admin-about-card">
    <div className="admin-about-preview">
      {previewUrl ? <img src={previewUrl} alt="소개 사진 미리보기" /> : <p>등록된 소개 사진이 없습니다.</p>}
    </div>
    <form action={saveAction} className="admin-about-form" onSubmit={(event) => { if (isOptimizing) event.preventDefault(); }}>
      <label htmlFor="about-image">소개 사진 선택</label>
      <label
        className={`poster-dropzone${isDragging ? " is-dragging" : ""}`}
        htmlFor="about-image"
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void selectFile(file);
        }}
      >
        <ImageIcon size={26} />
        <span><strong>{isOptimizing ? "사진을 최적화하고 있습니다." : "사진을 여기에 끌어다 놓으세요"}</strong><small>가로 최대 800px · 세로 비율 유지 · WebP 자동 변환</small></span>
      </label>
      <input ref={inputRef} className="poster-file-input" id="about-image" name="about_image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void selectFile(file);
      }} />
      <small>원본이 800px보다 작으면 확대하지 않습니다. JPG, PNG, WEBP · 원본 최대 10MB</small>
      <button className="primary-button" type="submit" disabled={isSaving || isOptimizing}>{(isSaving || isOptimizing) ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}{isOptimizing ? "이미지 최적화 중" : isSaving ? "저장 중" : imagePath ? "사진 교체" : "사진 저장"}</button>
      {saveState.error && <p className="form-error" role="alert">{saveState.error}</p>}
      {clientError && <p className="form-error" role="alert">{clientError}</p>}
      {saveState.success && <p className="form-success" role="status">{saveState.success}</p>}
    </form>
    {imagePath && <form action={deleteAction} className="admin-about-delete"><input type="hidden" name="about_image_path" value={imagePath} /><button className="secondary-button" type="submit" disabled={isDeleting}>{isDeleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}사진 삭제</button>{deleteState.error && <p className="form-error" role="alert">{deleteState.error}</p>}</form>}
  </section>;
}
