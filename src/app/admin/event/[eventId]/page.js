export const dynamic = "force-dynamic";

import { getSupabaseClient } from "../../../../lib/supabase";
import BrandingEditor from "./BrandingEditor";

export default async function AdminEventPage({ params }) {
  const { eventId = "" } = await params;

  const supabase = getSupabaseClient();
  const { data: branding } = supabase
    ? await supabase
        .from("gallery_event_branding")
        .select("accent_color, bg_color, text_color, secondary_text_color, event_name")
        .eq("event_id", eventId)
        .maybeSingle()
    : { data: null };

  return <BrandingEditor eventId={eventId} initialBranding={branding || null} />;
}
