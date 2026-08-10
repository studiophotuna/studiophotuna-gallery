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

  return <BrandingEditor eventId={data.event_id} gallerySlug={slug} />;
}
