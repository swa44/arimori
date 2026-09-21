/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { DeleteScheduleButton } from "@/components/admin/DeleteScheduleButton";
import { DeleteVideoButton } from "@/components/admin/DeleteVideoButton";
import { DeleteInquiryButton } from "@/components/admin/DeleteInquiryButton";
import { DeleteNewsButton } from "@/components/admin/DeleteNewsButton";
import { InquirySettingsForm } from "@/components/admin/InquirySettingsForm";
import { AboutImageForm } from "@/components/admin/AboutImageForm";
import { AboutStageImageManager } from "@/components/admin/AboutStageImageManager";
import { HomeHeroForm } from "@/components/admin/HomeHeroForm";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/lib/supabase/schedules";
import type { VideoRow } from "@/lib/supabase/videos";
import type { NewsRow } from "@/lib/supabase/news";
import { defaultHomeHero, getSiteImageUrl } from "@/lib/supabase/site-settings";
import type { AboutStageImage } from "@/data/about-stages";
import type { ReviewCampaign, StampProgram } from "@/lib/supabase/events";

export const metadata = { title: "관리자" };
const pageSize = 20;
type AdminTab = "schedules" | "videos" | "news" | "events" | "inquiries" | "home" | "about";
type InquiryRow = { id: string; name: string; phone: string; email: string; message: string; status: "new" | "in_progress" | "completed"; sms_status: "pending" | "sent" | "failed" | "not_configured"; created_at: string };
const inquiryStatusLabel = { new: "새 문의", in_progress: "처리 중", completed: "처리 완료" };

function scheduleHref(view: "upcoming" | "past", page: number, search: string, year: string) {
  const params = new URLSearchParams({ tab: "schedules", view });
  if (page > 1) params.set("page", String(page));
  if (search) params.set("q", search);
  if (view === "past" && year) params.set("year", year);
  return `/admin?${params.toString()}`;
}
function inquiryHref(page: number) { return `/admin?tab=inquiries${page > 1 ? `&page=${page}` : ""}`; }
function dateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string; page?: string; q?: string; year?: string }> }) {
  const params = await searchParams;
  const activeTab: AdminTab = params.tab === "videos" || params.tab === "news" || params.tab === "events" || params.tab === "inquiries" || params.tab === "home" || params.tab === "about" ? params.tab : "schedules";
  const scheduleView = params.view === "past" ? "past" : "upcoming";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = (params.q ?? "").trim();
  const safeSearch = search.replace(/[,%()]/g, " ").trim();
  const year = /^\d{4}$/.test(params.year ?? "") ? params.year! : "";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const currentYear = Number(today.slice(0, 4));
  const yearOptions = Array.from({ length: 10 }, (_, index) => String(currentYear - index));
  const supabase = await createClient();
  let schedules: ScheduleRow[] = [];
  let scheduleCount = 0;
  let videos: VideoRow[] = [];
  let news: NewsRow[] = [];
  let inquiries: InquiryRow[] = [];
  let inquiryCount = 0;
  let notificationPhone = "";
  let aboutImagePath: string | null = null;
  let aboutStageImages: AboutStageImage[] = [];
  let homeHero = defaultHomeHero;
  let stampPrograms: StampProgram[] = [];
  let reviewCampaigns: Array<ReviewCampaign & { ARIMORI_schedules: { title: string } | null }> = [];

  if (activeTab === "schedules") {
    let query = supabase.from("ARIMORI_schedules").select("*", { count: "exact" });
    if (scheduleView === "past") {
      query = query.lt("start_at", todayStart).order("start_at", { ascending: false });
      if (year) {
        const nextYear = String(Number(year) + 1);
        query = query.gte("start_at", new Date(`${year}-01-01T00:00:00+09:00`).toISOString()).lt("start_at", new Date(`${nextYear}-01-01T00:00:00+09:00`).toISOString());
      }
    } else query = query.gte("start_at", todayStart).order("start_at", { ascending: true });
    if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%`);
    const from = (currentPage - 1) * pageSize;
    const { data, count } = await query.range(from, from + pageSize - 1);
    schedules = (data ?? []) as ScheduleRow[];
    scheduleCount = count ?? 0;
  } else if (activeTab === "videos") {
    const { data } = await supabase.from("ARIMORI_videos").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: false });
    videos = (data ?? []) as VideoRow[];
  } else if (activeTab === "news") {
    const { data } = await supabase.from("ARIMORI_news").select("*").order("created_at", { ascending: false });
    news = (data ?? []) as NewsRow[];
  } else if (activeTab === "inquiries") {
    const from = (currentPage - 1) * pageSize;
    const [{ data, count }, { data: settings }] = await Promise.all([
      supabase.from("ARIMORI_inquiries").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, from + pageSize - 1),
      supabase.from("ARIMORI_inquiry_settings").select("notification_phone").eq("id", true).maybeSingle(),
    ]);
    inquiries = (data ?? []) as InquiryRow[];
    inquiryCount = count ?? 0;
    notificationPhone = settings?.notification_phone ?? "";
  } else if (activeTab === "events") {
    const [{ data: stamps }, { data: campaigns }] = await Promise.all([
      supabase.from("ARIMORI_stamp_programs").select("*").order("created_at", { ascending: false }),
      supabase.from("ARIMORI_review_campaigns").select("*, ARIMORI_schedules(title)").order("created_at", { ascending: false }),
    ]);
    stampPrograms = (stamps ?? []) as StampProgram[];
    reviewCampaigns = (campaigns ?? []) as typeof reviewCampaigns;
  } else if (activeTab === "home") {
    const { data } = await supabase.from("ARIMORI_site_settings").select("home_hero_kicker, home_hero_title, home_hero_subtitle").eq("id", true).maybeSingle();
    homeHero = {
      kicker: data?.home_hero_kicker?.trim() || defaultHomeHero.kicker,
      title: data?.home_hero_title?.trim() || defaultHomeHero.title,
      subtitle: data?.home_hero_subtitle?.trim() || defaultHomeHero.subtitle,
    };
  } else {
    const [{ data: settings }, { data: stageImages }] = await Promise.all([
      supabase.from("ARIMORI_site_settings").select("about_image_path").eq("id", true).maybeSingle(),
      supabase.from("ARIMORI_about_stage_images").select("*").order("stage_key").order("display_order").order("created_at"),
    ]);
    aboutImagePath = settings?.about_image_path ?? null;
    aboutStageImages = (stageImages ?? []) as AboutStageImage[];
  }
  const totalPages = Math.max(1, Math.ceil((activeTab === "inquiries" ? inquiryCount : scheduleCount) / pageSize));
  const activeGroup = activeTab === "events" ? "events" : activeTab === "inquiries" || activeTab === "home" ? "etc" : "manage";

  return <div className="admin-shell">
    <header className="admin-topbar"><Link href="/" className="admin-brand">아리모리 <span>관리자</span></Link><LogoutButton /></header>
    <div className="admin-container">
      <nav className="admin-tabs" aria-label="관리 메뉴">
        <Link href="/admin?tab=schedules" className={activeGroup === "manage" ? "is-active" : ""}>관리</Link>
        <Link href="/admin?tab=events" className={activeGroup === "events" ? "is-active" : ""}>이벤트</Link>
        <Link href="/admin?tab=inquiries" className={activeGroup === "etc" ? "is-active" : ""}>기타</Link>
      </nav>

      {activeGroup === "manage" && <nav className="admin-subtabs" aria-label="관리 세부 메뉴">
        <Link href="/admin?tab=schedules" className={activeTab === "schedules" ? "is-active" : ""}>일정</Link>
        <Link href="/admin?tab=videos" className={activeTab === "videos" ? "is-active" : ""}>영상</Link>
        <Link href="/admin?tab=news" className={activeTab === "news" ? "is-active" : ""}>소식</Link>
        <Link href="/admin?tab=about" className={activeTab === "about" ? "is-active" : ""}>소개</Link>
      </nav>}
      {activeGroup === "events" && <nav className="admin-subtabs" aria-label="이벤트 세부 메뉴"><Link href="/admin?tab=events" className="is-active">스탬프·공연 후기</Link></nav>}
      {activeGroup === "etc" && <nav className="admin-subtabs" aria-label="기타 세부 메뉴">
        <Link href="/admin?tab=inquiries" className={activeTab === "inquiries" ? "is-active" : ""}>공연문의</Link>
        <Link href="/admin?tab=home" className={activeTab === "home" ? "is-active" : ""}>홈 화면</Link>
      </nav>}

      {activeTab === "schedules" && <>
        <div className="admin-heading"><div><h1>공연 일정</h1><p>{scheduleView === "upcoming" ? "예정 공연" : "지난 공연"} 총 {scheduleCount}개</p></div><Link href="/admin/schedule/new" className="primary-button"><Plus size={16} /> 새 일정</Link></div>
        <nav className="admin-schedule-tabs" aria-label="일정 구분"><Link href={scheduleHref("upcoming", 1, search, "")} className={scheduleView === "upcoming" ? "is-active" : ""}>예정 공연</Link><Link href={scheduleHref("past", 1, search, year)} className={scheduleView === "past" ? "is-active" : ""}>지난 공연</Link></nav>
        <form className="admin-filter" method="get">
          <input type="hidden" name="tab" value="schedules" /><input type="hidden" name="view" value={scheduleView} />
          <label className="admin-filter__search"><Search size={16} /><input name="q" defaultValue={search} placeholder="공연명 또는 장소 검색" /></label>
          {scheduleView === "past" && <select name="year" defaultValue={year} aria-label="공연 연도"><option value="">전체 연도</option>{yearOptions.map((item) => <option value={item} key={item}>{item}년</option>)}</select>}
          <button className="secondary-button" type="submit">검색</button>{(search || year) && <Link href={scheduleHref(scheduleView, 1, "", "")} className="admin-filter__reset">초기화</Link>}
        </form>
        <section className="admin-card">
          {schedules.length === 0 && <div className="admin-empty">{search || year ? "검색 조건에 맞는 공연이 없습니다." : scheduleView === "upcoming" ? "예정된 공연이 없습니다." : "지난 공연이 없습니다."}</div>}
          {schedules.map((item) => <article className="admin-event" key={item.id}><div className="admin-event__date">{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" }).format(new Date(item.start_at))}</div><div><h2>{item.title}</h2><p>{item.location} · {item.is_public ? "공개" : "비공개"}</p></div><div className="admin-actions"><Link href={`/admin/schedule/${item.id}/edit`} aria-label={`${item.title} 수정`}><Pencil size={16} /></Link><DeleteScheduleButton id={item.id} posterPath={item.poster_path} posterPaths={item.poster_paths} title={item.title} /></div></article>)}
        </section>
      </>}

      {activeTab === "videos" && <>
        <div className="admin-heading"><div><h1>공연 영상</h1><p>등록된 영상 {videos.length}개</p></div><Link href="/admin/video/new" className="primary-button"><Plus size={16} /> 새 영상</Link></div>
        <section className="admin-card">{videos.length === 0 && <div className="admin-empty">등록된 영상이 없습니다. 유튜브 영상을 추가해 보세요.</div>}{videos.map((item) => <article className="admin-event" key={item.id}><div className="admin-video-thumb"><img src={`https://i.ytimg.com/vi/${item.youtube_id}/default.jpg`} alt="" /></div><div><h2>{item.title}</h2><p>순서 {item.display_order} · {item.is_public ? "공개" : "비공개"}</p></div><div className="admin-actions"><Link href={`/admin/video/${item.id}/edit`} aria-label={`${item.title} 수정`}><Pencil size={16} /></Link><DeleteVideoButton id={item.id} title={item.title} /></div></article>)}</section>
      </>}

      {activeTab === "news" && <>
        <div className="admin-heading"><div><h1>아리모리 소식</h1><p>등록된 소식 {news.length}개</p></div><Link href="/admin/news/new" className="primary-button"><Plus size={16} /> 새 소식</Link></div>
        <section className="admin-card">
          {news.length === 0 && <div className="admin-empty">등록된 소식이 없습니다.</div>}
          {news.map((item) => <article className="admin-event" key={item.id}><span className="tag tag--teal">{item.badge}</span><div><h2>{item.title}</h2><p>{item.content}</p></div><div className="admin-actions"><Link href={`/admin/news/${item.id}/edit`} aria-label={`${item.title} 수정`}><Pencil size={16} /></Link><DeleteNewsButton id={item.id} title={item.title} /></div></article>)}
        </section>
      </>}

      {activeTab === "inquiries" && <>
        <div className="admin-heading"><div><h1>공연 문의</h1><p>접수된 문의 총 {inquiryCount}개</p></div></div>
        <InquirySettingsForm phone={notificationPhone} />
        <section className="admin-card inquiry-admin-list">
          {inquiries.length === 0 && <div className="admin-empty">접수된 공연 문의가 없습니다.</div>}
          {inquiries.map((item) => <article className="admin-inquiry-row" key={item.id}><Link href={`/admin/inquiry/${item.id}`} className="admin-inquiry"><span className={`inquiry-status inquiry-status--${item.status}`}>{inquiryStatusLabel[item.status]}</span><div><h2>{item.name}</h2><p>{item.phone} · {dateTime(item.created_at)}</p><span>{item.message}</span></div><ChevronRight size={18} /></Link><DeleteInquiryButton id={item.id} name={item.name} /></article>)}
        </section>
      </>}

      {activeTab === "events" && <>
        <div className="admin-heading"><div><h1>참여 이벤트</h1><p>스탬프 체험과 공연 후기를 각각 관리합니다.</p></div></div>
        <section className="admin-event-dashboard">
          <div className="admin-section"><div className="admin-section__heading"><div><h2>체험부스 스탬프</h2><p>참여자 QR을 부스에서 스캔해 완료를 기록합니다.</p></div><Link href="/admin/event/stamp/new" className="primary-button"><Plus size={16} /> 새 스탬프</Link></div>
            <div className="admin-card">{stampPrograms.length === 0 && <div className="admin-empty">등록된 스탬프 프로그램이 없습니다.</div>}{stampPrograms.map((item) => <Link className="admin-event admin-event-link" href={`/admin/event/stamp/${item.id}`} key={item.id}><div><h2>{item.title}</h2><p>{item.starts_on}~{item.ends_on} · {item.required_stamps}개 완료 · {item.is_active ? "공개" : "비공개"}</p></div><ChevronRight size={18} /></Link>)}</div>
          </div>
          <div className="admin-section"><div className="admin-section__heading"><div><h2>공연 후기·추첨</h2><p>QR로 후기를 받고 승인한 글만 공연 상세에 공개합니다.</p></div><Link href="/admin/event/review/new" className="primary-button"><Plus size={16} /> 새 후기</Link></div>
            <div className="admin-card">{reviewCampaigns.length === 0 && <div className="admin-empty">등록된 후기 이벤트가 없습니다.</div>}{reviewCampaigns.map((item) => <Link className="admin-event admin-event-link" href={`/admin/event/review/${item.id}`} key={item.id}><div><h2>{item.title}</h2><p>{item.ARIMORI_schedules?.title ?? "연결 공연 없음"} · {item.is_active ? "접수 공개" : "접수 중지"}</p></div><ChevronRight size={18} /></Link>)}</div>
          </div>
        </section>
      </>}

      {activeTab === "about" && <>
        <div className="admin-heading"><div><h1>소개 관리</h1><p>대표 사진과 무대별 갤러리를 관리합니다.</p></div></div>
        <AboutImageForm imagePath={aboutImagePath} imageUrl={getSiteImageUrl(aboutImagePath)} />
        <AboutStageImageManager images={aboutStageImages.map((image) => ({ ...image, url: getSiteImageUrl(image.image_path) ?? "" }))} />
      </>}

      {activeTab === "home" && <>
        <div className="admin-heading"><div><h1>홈 화면 관리</h1><p>홈 상단의 세 문구를 관리합니다.</p></div></div>
        <HomeHeroForm {...homeHero} />
      </>}

      {((activeTab === "schedules" && scheduleCount > pageSize) || (activeTab === "inquiries" && inquiryCount > pageSize)) && <nav className="admin-pagination" aria-label="페이지 이동">
        {currentPage > 1 ? <Link href={activeTab === "inquiries" ? inquiryHref(currentPage - 1) : scheduleHref(scheduleView, currentPage - 1, search, year)}>이전</Link> : <span />}<strong>{currentPage} / {totalPages}</strong>{currentPage < totalPages ? <Link href={activeTab === "inquiries" ? inquiryHref(currentPage + 1) : scheduleHref(scheduleView, currentPage + 1, search, year)}>다음</Link> : <span />}
      </nav>}
    </div>
  </div>;
}
