"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function GalleryPage({ params }) {
  const [slug, setSlug] = useState("");
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadGallery() {
      try {
        const resolvedParams = await params;
        const resolvedSlug = resolvedParams?.slug || "";
        if (!mounted) return;

        setSlug(resolvedSlug);

        const { data, error } = await supabase
          .from("galleries")
          .select(
            "slug, final_url, final_burst_url, burst_urls, photo_urls, created_at, expires_at"
          )
          .eq("slug", resolvedSlug)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          setErrorText(error.message || "Failed to load gallery.");
          setLoading(false);
          return;
        }

        if (!data) {
          setGallery(null);
          setLoading(false);
          return;
        }

        setGallery(data);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setErrorText(err?.message || "Failed to load gallery.");
        setLoading(false);
      }
    }

    loadGallery();
    return () => {
      mounted = false;
    };
  }, [params]);

  const items = useMemo(() => {
    if (!gallery) return [];

    const slides = [];

    const photoUrls = Array.isArray(gallery.photo_urls) ? gallery.photo_urls : [];
    const burstUrls = Array.isArray(gallery.burst_urls) ? gallery.burst_urls : [];

    photoUrls.forEach((url, index) => {
      if (!url) return;
      slides.push({
        type: "photo",
        title: `Photo ${index + 1}`,
        url,
      });
    });

    if (gallery.final_url) {
      slides.push({
        type: "final",
        title: "Final Output",
        url: gallery.final_url,
      });
    }

    if (gallery.final_burst_url) {
      slides.push({
        type: "final_burst",
        title: "Final Output with Burst",
        url: gallery.final_burst_url,
      });
    }

    burstUrls.forEach((url, index) => {
      if (!url) return;
      slides.push({
        type: "burst_slot",
        title: `Burst Slot ${index + 1}`,
        url,
      });
    });

    return slides;
  }, [gallery]);

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(0);
    }
  }, [items, activeIndex]);

  function goPrev() {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }

  function goNext() {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Loading gallery...</h1>
        </div>
      </main>
    );
  }

  if (errorText) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Gallery Error</h1>
          <p style={styles.subtext}>{errorText}</p>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Gallery not found</h1>
          <p style={styles.subtext}>
            The link may be invalid or the gallery has not been created yet.
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>No photos available</h1>
          <p style={styles.subtext}>This gallery does not contain images yet.</p>
        </div>
      </main>
    );
  }

  const activeItem = items[activeIndex];

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Studio Photuna</h1>
          <p style={styles.subtext}>Your Photo Gallery</p>
          <p style={styles.meta}>Session: {slug}</p>
          <p style={styles.meta}>Created: {formatDate(gallery.created_at)}</p>
        </div>

        <div style={styles.carouselCard}>
          <div style={styles.carouselTop}>
            <button onClick={goPrev} style={styles.arrowBtn}>
              ‹
            </button>

            <div style={styles.imageArea}>
              <div style={styles.imageTitle}>{activeItem.title}</div>

              <a
                href={activeItem.url}
                download
                target="_blank"
                rel="noreferrer"
                style={styles.imageLink}
              >
                <img
                  src={activeItem.url}
                  alt={activeItem.title}
                  style={styles.image}
                />
              </a>
            </div>

            <button onClick={goNext} style={styles.arrowBtn}>
              ›
            </button>
          </div>

          <div style={styles.actionRow}>
            <a
              href={activeItem.url}
              download
              target="_blank"
              rel="noreferrer"
              style={styles.downloadBtn}
            >
              Download {activeItem.title}
            </a>
          </div>

          <div style={styles.dots}>
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                style={{
                  ...styles.dot,
                  ...(activeIndex === index ? styles.dotActive : {}),
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "24px 16px",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  wrapper: {
    width: "100%",
    maxWidth: "960px",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    color: "#111",
  },
  subtext: {
    margin: "8px 0",
    color: "#555",
    fontSize: "15px",
  },
  meta: {
    margin: "4px 0",
    color: "#666",
    fontSize: "13px",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    margin: "60px auto",
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  carouselCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  carouselTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  arrowBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    flexShrink: 0,
  },
  imageArea: {
    flex: 1,
    textAlign: "center",
  },
  imageTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111",
    marginBottom: "14px",
  },
  imageLink: {
    display: "block",
    textDecoration: "none",
  },
  image: {
    width: "100%",
    maxHeight: "72vh",
    objectFit: "contain",
    borderRadius: "14px",
    border: "1px solid #e5e5e5",
    background: "#fafafa",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: "18px",
  },
  downloadBtn: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "10px",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    border: "none",
    background: "#cfcfcf",
    cursor: "pointer",
  },
  dotActive: {
    background: "#111",
    width: "26px",
  },
};
