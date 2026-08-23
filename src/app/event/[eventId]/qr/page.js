import { getSupabaseClient } from "../../../../lib/supabase";
import { getPublicEventName } from "../../../../lib/eventName";
import EventQrClient from "./EventQrClient";

export default async function EventQrPage({ params }) {
  const { eventId = "" } = await params;

  if (!eventId) {
    return <EventQrClient eventId="" eventName="" initialError="Missing event id." />;
  }

  const supabase = getSupabaseClient();
  const [eventName, brandingResult] = await Promise.all([
    supabase ? getPublicEventName(supabase, eventId) : "",
    supabase
      ? supabase
          .from("gallery_event_branding")
          .select("accent_color, bg_color, text_color, secondary_text_color, event_name")
          .eq("event_id", eventId)
          .maybeSingle()
      : { data: null },
  ]);

  const branding = brandingResult?.data || null;
  const displayName = branding?.event_name || eventName;

  return (
    <EventQrClient
      eventId={eventId}
      eventName={displayName}
      initialError=""
      accentColor={branding?.accent_color || null}
      bgColor={branding?.bg_color || null}
      textColor={branding?.text_color || null}
      secondaryTextColor={branding?.secondary_text_color || null}
    />
  );
}
