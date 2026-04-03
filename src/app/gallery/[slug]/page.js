import { supabase } from "../../../lib/supabase";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage({ params }) {
  const { slug = "" } = await params;

  if (!slug) {
    return <GalleryClient gallery={null} initialError="Missing gallery slug." />;
  }

  const { data, error } = await supabase
    .from("galleries")
    .select("slug, final_url, final_burst_url, burst_urls, photo_urls, expires_at")
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

  return <GalleryClient gallery={data || null} initialError="" />;
}
