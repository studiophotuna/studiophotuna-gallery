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

  const eventName = data?.event_id ? await getPublicEventName(supabase, data.event_id) : "";

  // Event-level gallery (session_id is null): show a per-session picker
  if (data && data.session_id === null && data.event_id) {
    const { data: sessionRows } = await supabase
      .from("galleries")
      .select("slug, final_url, final_video_url, photo_urls, burst_video_urls, created_at")
      .eq("event_id", data.event_id)
      .not("session_id", "is", null)
      .order("created_at", { ascending: true });

    const sessions = (sessionRows || []).map((s, idx) => ({
      index: idx + 1,
      slug: s.slug,
      createdAt: s.created_at,
      finalUrl: s.final_url,
      finalVideoUrl: s.final_video_url,
      photoUrls: Array.isArray(s.photo_urls) ? s.photo_urls : [],
      burstVideoUrls: Array.isArray(s.burst_video_urls) ? s.burst_video_urls : [],
    }));

    return (
      <GalleryClient gallery={data} sessions={sessions} eventName={eventName} initialError="" />
    );
  }

  return <GalleryClient gallery={data || null} eventName={eventName} initialError="" />;
}
