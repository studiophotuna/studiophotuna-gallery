export const dynamic = "force-dynamic";

import { getSupabaseClient } from "../../../../lib/supabase";
import BrandingEditor from "../../../../components/BrandingEditor";

export default async function AdminGalleryPage({ params }) {
  const { slug = "" } = await params;

  if (!slug) {
    return <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Missing gallery slug.</div>;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Gallery configuration error.</div>;
  }

  const { data, error } = await supabase
    .from("galleries")
    .select("event_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data?.event_id) {
    return <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Gallery not found: {slug}</div>;
  }

  const { data: branding } = await supabase
    .from("gallery_event_branding")
    .select("accent_color, bg_color, text_color, secondary_text_color, event_name")
    .eq("event_id", data.event_id)
    .maybeSingle();

  return (
    <BrandingEditor
      eventId={data.event_id}
      gallerySlug={slug}
      initialBranding={branding || null}
    />
  );
}
