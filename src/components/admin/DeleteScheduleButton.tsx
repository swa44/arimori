"use client";

import { Trash2 } from "lucide-react";
import { deleteSchedule } from "@/app/admin/actions";

export function DeleteScheduleButton({ id, posterPath, title }: { id: string; posterPath: string | null; title: string }) {
  return (
    <form
      action={deleteSchedule}
      onSubmit={(event) => {
        if (!window.confirm(`‘${title}’ 일정을 삭제할까요?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="poster_path" value={posterPath ?? ""} />
      <button aria-label={`${title} 삭제`} type="submit"><Trash2 size={16} /></button>
    </form>
  );
}
