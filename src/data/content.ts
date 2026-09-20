export type BookingType = "reservation" | "free" | "onsite";

export type Schedule = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  description: string;
  category: string;
  tone: "olive" | "teal" | "brown";
  posterPath?: string | null;
  posterUrl?: string | null;
  posterPaths?: string[];
  posterUrls?: string[];
  mapQuery?: string | null;
  mapUrl?: string | null;
  bookingType?: BookingType;
  bookingUrl?: string | null;
  isCancelled?: boolean;
  isFeatured?: boolean;
  reviews?: Array<{
    id: string;
    display_name: string;
    content: string;
    created_at: string;
  }>;
};

export const schedules: Schedule[] = [
  {
    id: "autumn-madang",
    title: "가을 마당, 소리로 잇다",
    date: "2026-09-20",
    time: "오후 5:00",
    location: "한옥문화마당",
    address: "경기도 이천시 문화로 23",
    description:
      "해 질 녘의 마당에서 우리 음악과 이야기를 편안하게 만나는 아리모리의 가을 기획공연입니다.",
    category: "기획공연",
    tone: "olive",
  },
  {
    id: "village-visit",
    title: "우리 동네 찾아가는 음악회",
    date: "2026-09-26",
    time: "오후 2:00",
    location: "장호원 복지회관",
    address: "경기도 이천시 장호원읍",
    description:
      "가까운 동네에서 남녀노소 함께 즐기는 친근한 해설과 전통 연희 중심의 찾아가는 공연입니다.",
    category: "찾아가는 공연",
    tone: "teal",
  },
  {
    id: "culture-day",
    title: "문화가 있는 날 특별공연",
    date: "2026-10-03",
    time: "오후 4:30",
    location: "설봉공원 야외무대",
    address: "경기도 이천시 경충대로2709번길 128",
    description:
      "전통의 흥과 오늘의 감각을 한 무대에 담은 야외 공연으로, 누구나 무료로 관람할 수 있습니다.",
    category: "야외공연",
    tone: "brown",
  },
];

export const newsItems = [
  { date: "09. 12", tag: "소식", title: "아리모리 가을 공연 소식을 전합니다" },
  { date: "08. 29", tag: "기록", title: "여름밤 풍류 공연 현장 스케치" },
  { date: "08. 10", tag: "안내", title: "하반기 찾아가는 공연 신청 안내" },
];
