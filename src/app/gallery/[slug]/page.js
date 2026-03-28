"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
            "slug, final_url, final_burst_url, burst_urls, photo_urls, expires_at"
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
        key: `photo-${index}`,
        url,
        downloadName: `photo-${index + 1}.png`,
      });
    });

    if (gallery.final_url) {
      slides.push({
        key: "final",
        url: gallery.final_url,
        downloadName: "final-output.png",
      });
    }

    if (gallery.final_burst_url) {
      slides.push({
        key: "final-burst",
        url: gallery.final_burst_url,
        downloadName: "final-output-with-burst.png",
      });
    }

    burstUrls.forEach((url, index) => {
      if (!url) return;
      slides.push({
        key: `burst-${index}`,
        url,
        downloadName: `burst-slot-${index + 1}.png`,
      });
    });

    return slides;
  }, [gallery]);

  useEffect(() => {
    if (!items.length) return;
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
        <div style={styles.centerCard}>
          <p style={styles.message}>Loading gallery...</p>
        </div>
      </main>
    );
  }

  if (errorText) {
    return (
      <main style={styles.page}>
        <div style={styles.centerCard}>
          <p style={styles.message}>Unable to load gallery.</p>
          <p style={styles.subMessage}>{errorText}</p>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main style={styles.page}>
        <div style={styles.centerCard}>
          <p style={styles.message}>Gallery not found</p>
          <p style={styles.subMessage}>
            The link may be invalid or the gallery is not available.
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main style={styles.page}>
        <div style={styles.centerCard}>
          <p style={styles.message}>No photos available</p>
          <p style={styles.subMessage}>This gallery does not contain images yet.</p>
        </div>
      </main>
    );
  }

  const activeItem = items[activeIndex];

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <img
            src="/logo.png"
            alt="Studio Photuna"
            style={styles.logo}
          />
        </header>

        <section style={styles.viewerCard}>
          <div style={styles.carouselRow}>
            <button onClick={goPrev} style={styles.arrowBtn} aria-label="Previous image">
              ‹
            </button>

            <div style={styles.imageWrap}>
              <a
                href={activeItem.url}
                download={activeItem.downloadName}
                target="_blank"
                rel="noreferrer"
                style={styles.imageLink}
              >
                <img
                  src={activeItem.url}
                  alt="Gallery image"
                  style={styles.image}
                />
              </a>
            </div>

            <button onClick={goNext} style={styles.arrowBtn} aria-label="Next image">
              ›
            </button>
          </div>

          <div style={styles.bottomArea}>
            <a
              href={activeItem.url}
              download={activeItem.downloadName}
              target="_blank"
              rel="noreferrer"
              style={styles.downloadBtn}
            >
              Download
            </a>

            <div style={styles.dots}>
              {items.map((item, index) => (
                <button
                  key={item.key}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to image ${index + 1}`}
                  style={{
                    ...styles.dot,
                    ...(activeIndex === index ? styles.dotActive : {}),
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f4f5",
    padding: "16px 12px 28px",
    fontFamily: "Arial, sans-serif",
  },
  wrapper: {
    width: "100%",
    maxWidth: "920px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "14px",
    paddingTop: "6px",
  },
  logo: {
    maxWidth: "180px",
    width: "100%",
    height: "auto",
    objectFit: "contain",
  },
  viewerCard: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "14px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  carouselRow: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
    alignItems: "center",
    gap: "10px",
  },
  arrowBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    border: "none",
    background: "#111111",
    color: "#ffffff",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
  },
  imageWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLink: {
    display: "block",
    width: "100%",
    textDecoration: "none",
  },
  image: {
    width: "100%",
    maxHeight: "74vh",
    objectFit: "contain",
    borderRadius: "18px",
    background: "#fafafa",
    border: "1px solid #ececec",
    display: "block",
  },
  bottomArea: {
    marginTop: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  downloadBtn: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "170px",
    padding: "13px 20px",
    borderRadius: "14px",
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "15px",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  dot: {
    width: "9px",
    height: "9px",
    borderRadius: "999px",
    border: "none",
    background: "#d4d4d8",
    cursor: "pointer",
    padding: 0,
  },
  dotActive: {
    width: "26px",
    background: "#111111",
  },
  centerCard: {
    maxWidth: "560px",
    margin: "80px auto 0",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px 22px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  message: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#111111",
  },
  subMessage: {
    margin: "10px 0 0",
    color: "#666666",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};
