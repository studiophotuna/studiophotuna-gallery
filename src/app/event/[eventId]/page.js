export const dynamic = "force-dynamic";

import { getSupabaseClient } from "../../../lib/supabase";
import { getPublicEventName } from "../../../lib/eventName";
import EventGalleryClient from "./EventGalleryClient";

export default async function EventGalleryPage({ params }) {
  const { eventId = "" } = await params;

  if (!eventId) {
    return <EventGalleryClient sessions={[]} eventName="" initialError="Missing event id." />;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return (
      <EventGalleryClient
        sessions={[]}
        eventName=""
        initialError="Gallery is missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel."
      />
    );
  }

  const { data, error } = await supabase
    .from("galleries")
    .select("slug, final_url, final_video_url, photo_urls, created_at, gallery_tier")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <EventGalleryClient
        sessions={[]}
        eventName=""
        initialError={error.message || "Failed to load event gallery."}
      />
    );
  }

  const galleryTier = data?.[0]?.gallery_tier || "free";

  const [rpcEventName, brandingResult] = await Promise.all([
    getPublicEventName(supabase, eventId),
    supabase
      .from("gallery_event_branding")
      .select("accent_color, bg_color, text_color, secondary_text_color, event_name")
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  const branding = brandingResult?.data || null;
  const eventName = branding?.event_name || rpcEventName;

  return (
    <EventGalleryClient
      sessions={data || []}
      eventName={eventName}
      initialError=""
      galleryTier={galleryTier}
      accentColor={branding?.accent_color || null}
      bgColor={branding?.bg_color || null}
      textColor={branding?.text_color || null}
      secondaryTextColor={branding?.secondary_text_color || null}
    />
  );
}
