import { supabase } from "../../../lib/supabase";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: "1.25rem",
        fontWeight: 700,
        marginBottom: 14,
        color: "#111827",
      }}
    >
      {children}
    </h2>
  );
}

function ImageCard({ title, imageUrl, downloadLabel }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      }}
    >
      <SectionTitle>{title}</SectionTitle>

      {imageUrl ? (
        <>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "12px 18px",
                borderRadius: 12,
                background: "#111827",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {downloadLabel}
            </a>
          </div>
        </>
      ) : (
        <p style={{ color: "#6b7280", margin: 0 }}>No image available.</p>
      )}
    </section>
  );
}

export default async function GalleryPage({ params }) {
  const { slug } = await params;

  const { data: gallery, error } = await supabase
    .from("galleries")
    .select(
      "slug, final_url, final_burst_url, burst_urls, created_at, expires_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 20,
            padding: 28,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ marginTop: 0, color: "#111827" }}>Gallery Error</h1>
          <p style={{ color: "#6b7280" }}>{error.message}</p>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 20,
            padding: 28,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ marginTop: 0, color: "#111827" }}>Gallery not found</h1>
          <p style={{ color: "#6b7280" }}>
            The link may be invalid or the gallery has not been created yet.
          </p>
        </div>
      </main>
    );
  }

  if (isExpired(gallery.expires_at)) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 20,
            padding: 28,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ marginTop: 0, color: "#111827" }}>Gallery expired</h1>
          <p style={{ color: "#6b7280" }}>
            This gallery is no longer available.
          </p>
        </div>
      </main>
    );
  }

  const burstUrls = Array.isArray(gallery.burst_urls) ? gallery.burst_urls : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #eef2f7 100%)",
        padding: "32px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Studio Photuna
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  lineHeight: 1.2,
                  color: "#111827",
                }}
              >
                Your Photo Booth Gallery
              </h1>
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#6b7280",
                  fontSize: 15,
                }}
              >
                Thank you for capturing your moments with us.
              </p>
            </div>

            <div
              style={{
                minWidth: 260,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 16,
              }}
            >
              <div style={{ marginBottom: 8, color: "#111827" }}>
                <strong>Session:</strong> {gallery.slug}
              </div>
              <div style={{ marginBottom: 8, color: "#374151" }}>
                <strong>Created:</strong> {formatDate(gallery.created_at)}
              </div>
              <div style={{ color: "#374151" }}>
                <strong>Available until:</strong> {formatDate(gallery.expires_at)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 24,
          }}
        >
          <ImageCard
            title="Final Output"
            imageUrl={gallery.final_url}
            downloadLabel="Download Final Output"
          />

          <ImageCard
            title="Final Output with Burst"
            imageUrl={gallery.final_burst_url}
            downloadLabel="Download Final with Burst"
          />

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            }}
          >
            <SectionTitle>Burst Per Slot</SectionTitle>

            {burstUrls.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {burstUrls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#f9fafb",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Burst slot ${index + 1}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                      }}
                    />
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: 10,
                        }}
                      >
                        Slot {index + 1}
                      </div>
                      <a
                        href={url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "#111827",
                          color: "#ffffff",
                          textDecoration: "none",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", margin: 0 }}>
                No burst slot images available yet.
              </p>
            )}
          </section>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 28,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          Powered by Studio Photuna
        </div>
      </div>
    </main>
  );
}
