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
    .select("slug, final_url, final_video_url, photo_urls, created_at")
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

  const eventName = await getPublicEventName(supabase, eventId);

  return <EventGalleryClient sessions={data || []} eventName={eventName} initialError="" />;
}
