/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { deleteAboutImage, updateAboutImage, type AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = { error: null };

export function AboutImageForm({ imagePath, imageUrl }: { imagePath: string | null; imageUrl: string | null }) {
  const [saveState, saveAction, isSaving] = useActionState(updateAboutImage, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteAboutImage, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setClientError("JPG, PNG, WEBP 이미지 파일만 등록할 수 있습니다.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setClientError("소개 사진은 10MB 이하로 등록해 주세요.");
      return false;
    }
    setClientError("");
    setPreviewUrl(URL.createObjectURL(file));
    return true;
  }

  return <section className="admin-about-card">
    <div className="admin-about-preview">
      {previewUrl ? <img src={previewUrl} alt="소개 사진 미리보기" /> : <p>등록된 소개 사진이 없습니다.</p>}
    </div>
    <form action={saveAction} className="admin-about-form">
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
          if (!file || !inputRef.current || !selectFile(file)) return;
          const transfer = new DataTransfer();
          transfer.items.add(file);
          inputRef.current.files = transfer.files;
        }}
      >
        <ImageIcon size={26} />
        <span><strong>사진을 여기에 끌어다 놓으세요</strong><small>또는 클릭해서 파일 선택 · JPG, PNG, WEBP · 최대 10MB</small></span>
      </label>
      <input ref={inputRef} className="poster-file-input" id="about-image" name="about_image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => {
        const file = event.target.files?.[0];
        if (file && !selectFile(file)) event.target.value = "";
      }} />
      <small>가로폭은 화면에 맞추고, 높이는 원본 사진 비율대로 표시됩니다. JPG, PNG, WEBP · 최대 10MB</small>
      <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}{isSaving ? "저장 중" : imagePath ? "사진 교체" : "사진 저장"}</button>
      {saveState.error && <p className="form-error" role="alert">{saveState.error}</p>}
      {clientError && <p className="form-error" role="alert">{clientError}</p>}
      {saveState.success && <p className="form-success" role="status">{saveState.success}</p>}
    </form>
    {imagePath && <form action={deleteAction} className="admin-about-delete"><input type="hidden" name="about_image_path" value={imagePath} /><button className="secondary-button" type="submit" disabled={isDeleting}>{isDeleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}사진 삭제</button>{deleteState.error && <p className="form-error" role="alert">{deleteState.error}</p>}</form>}
  </section>;
}
