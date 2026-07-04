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
      "slug, event_id, final_url, final_video_url, photo_urls, burst_video_urls, expires_at, created_at"
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

  return <GalleryClient gallery={data || null} eventName={eventName} initialError="" />;
}
