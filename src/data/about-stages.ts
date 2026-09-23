export const aboutStages = [
  { key: "planning", title: "기획 공연" },
  { key: "invitation", title: "초청 공연" },
  { key: "touring", title: "찾아가는 문화예술공연" },
  { key: "education", title: "문화예술교육 프로그램" },
  { key: "welfare", title: "문화복지 프로그램" },
  { key: "creation", title: "창작·앨범 제작 활동" },
] as const;

export type AboutStageKey = (typeof aboutStages)[number]["key"];

export type AboutStageImage = {
  id: string;
  stage_key: AboutStageKey;
  image_path: string;
  display_order: number;
  created_at: string;
};
