import { supabase } from "../../../lib/supabase";

export default async function GalleryPage({ params }) {
  const { slug } = await params;

  const { data: gallery, error } = await supabase
    .from("galleries")
    .select("slug, final_url, final_burst_url, burst_urls, created_at, expires_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Gallery Error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Gallery not found</h1>
        <p>The link may be invalid or the gallery has not been created yet.</p>
      </main>
    );
  }

  const burstUrls = Array.isArray(gallery.burst_urls) ? gallery.burst_urls : [];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 24 }}>Your Photo Booth Gallery</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Final Output</h2>
        {gallery.final_url ? (
          <img
            src={gallery.final_url}
            alt="Final output"
            style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }}
          />
        ) : (
          <p>No final output available.</p>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Final Output with Burst</h2>
        {gallery.final_burst_url ? (
          <img
            src={gallery.final_burst_url}
            alt="Final output with burst"
            style={{ width: "100%", borderRadius: 12, borderRadius: 12, border: "1px solid #ddd" }}
          />
        ) : (
          <p>No burst version available yet.</p>
        )}
      </section>

      <section>
        <h2>Burst Per Slot</h2>
        {burstUrls.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {burstUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Burst slot ${index + 1}`}
                style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }}
              />
            ))}
          </div>
        ) : (
          <p>No burst slot images available yet.</p>
        )}
      </section>
    </main>
  );
}