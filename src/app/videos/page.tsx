import { PageHeader } from "@/components/layout/PageHeader";
import { VideoGallery } from "@/components/videos/VideoGallery";
import { getPublicVideos } from "@/lib/supabase/videos";

export const metadata = { title: "공연 영상" };

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await getPublicVideos();

  return (
    <>
      <PageHeader eyebrow="PERFORMANCE FILM" title="공연 영상" description="무대 위의 흥과 따뜻한 순간을 영상으로 다시 만나보세요." />
      <div className="page-wrap">
        <VideoGallery videos={videos} />
      </div>
    </>
  );
}
