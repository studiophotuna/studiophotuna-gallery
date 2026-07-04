import { getSupabaseClient } from "../../../../lib/supabase";
import { getPublicEventName } from "../../../../lib/eventName";
import EventQrClient from "./EventQrClient";

export default async function EventQrPage({ params }) {
  const { eventId = "" } = await params;

  if (!eventId) {
    return <EventQrClient eventId="" eventName="" initialError="Missing event id." />;
  }

  const supabase = getSupabaseClient();
  const eventName = supabase ? await getPublicEventName(supabase, eventId) : "";

  return <EventQrClient eventId={eventId} eventName={eventName} initialError="" />;
}
