export const dynamic = "force-dynamic";

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
      "slug, session_id, event_id, final_url, final_video_url, photo_urls, burst_video_urls, expires_at, created_at, gallery_tier, accent_color, bg_color"
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

  // Fetch per-event branding (operator-configured via gallery admin)
  let accentColor = null;
  let bgColor = null;
  let textColor = null;
  let secondaryTextColor = null;
  if (data?.event_id) {
    const { data: branding } = await supabase
      .from("gallery_event_branding")
      .select("accent_color, bg_color, text_color, secondary_text_color")
      .eq("event_id", data.event_id)
      .maybeSingle();
    accentColor = branding?.accent_color || null;
    bgColor = branding?.bg_color || null;
    textColor = branding?.text_color || null;
    secondaryTextColor = branding?.secondary_text_color || null;
  }

  const galleryTier = data?.gallery_tier || "free";

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
      <GalleryClient gallery={data} sessions={sessions} eventName={eventName} initialError="" galleryTier={galleryTier} accentColor={accentColor} bgColor={bgColor} textColor={textColor} secondaryTextColor={secondaryTextColor} />
    );
  }

  return <GalleryClient gallery={data || null} eventName={eventName} initialError="" galleryTier={galleryTier} accentColor={accentColor} bgColor={bgColor} textColor={textColor} secondaryTextColor={secondaryTextColor} />;
}
