import { createClient } from "@supabase/supabase-js";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage({ params }) {
  const slug = params?.slug || "";

  if (!slug) {
    return <GalleryClient gallery={null} initialError="Missing gallery slug." />;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <GalleryClient
        gallery={null}
        initialError="Supabase environment variables are missing."
      />
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
