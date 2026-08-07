import { getSupabaseClient } from "../../../lib/supabase";
import { getPublicEventName } from "../../../lib/eventName";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage({ params }) {
  const { slug = "" } = await params;

  if (!slug) {
    return <GalleryClient gallery={null} initialError="Missing gallery slug." />;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return (
      <GalleryClient
        gallery={null}
        initialError="Gallery is missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel."
      />
    );
  }

  const { data, error } = await supabase
    .from("galleries")
    .select(
      "slug, session_id, event_id, final_url, final_video_url, photo_urls, burst_video_urls, expires_at, created_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <GalleryClient
        gallery={null}
        initialError={error.message || "Failed to load gallery."}
      />
    );
  }

  // Event-level gallery (session_id is null): aggregate all session galleries under this event
  let gallery = data || null;
  if (data && data.session_id === null && data.event_id) {
    const { data: sessions } = await supabase
      .from("galleries")
      .select("final_url, final_video_url, photo_urls, burst_video_urls, created_at")
      .eq("event_id", data.event_id)
      .not("session_id", "is", null)
      .order("created_at", { ascending: true });

    if (sessions && sessions.length > 0) {
      // Combine each session's content in order: final image, photos, final video, burst videos
      const allPhotoUrls = sessions.flatMap((s) => [
        ...(s.final_url ? [s.final_url] : []),
        ...(Array.isArray(s.photo_urls) ? s.photo_urls : []),
      ]);
      const allBurstVideoUrls = sessions.flatMap((s) => [
        ...(s.final_video_url ? [s.final_video_url] : []),
        ...(Array.isArray(s.burst_video_urls) ? s.burst_video_urls : []),
      ]);
      gallery = {
        ...data,
        photo_urls: allPhotoUrls,
        burst_video_urls: allBurstVideoUrls,
        final_url: null,
        final_video_url: null,
      };
    }
  }

  const eventName = data?.event_id ? await getPublicEventName(supabase, data.event_id) : "";

  return <GalleryClient gallery={gallery} eventName={eventName} initialError="" />;
}
