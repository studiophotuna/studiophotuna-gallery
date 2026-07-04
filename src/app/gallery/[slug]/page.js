import { getSupabaseClient } from "../../../lib/supabase";
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
      "slug, event_id, final_url, final_video_url, photo_urls, burst_video_urls, expires_at, created_at, user_id"
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

  let eventName = "";
  if (data?.user_id && data?.event_id) {
    const { data: boothSettings } = await supabase
      .from("booth_settings")
      .select("events")
      .eq("user_id", data.user_id)
      .maybeSingle();

    const events = Array.isArray(boothSettings?.events) ? boothSettings.events : [];
    const matchedEvent = events.find((event) => event?.id === data.event_id);
    eventName = matchedEvent?.name || "";
  }

  return <GalleryClient gallery={data || null} eventName={eventName} initialError="" />;
}
