"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function GalleryPage({ params }) {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(true);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const thumbRefs = useRef([]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadGallery() {
      try {
        const resolvedParams = await params;
        const resolvedSlug = resolvedParams?.slug || "";
        if (!mounted) return;

        const { data, error } = await supabase
          .from("galleries")
          .select("slug, final_url, final_video_url, photo_urls, burst_video_urls, expires_at")
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
  const burstVideoUrls = Array.isArray(gallery.burst_video_urls)
    ? gallery.burst_video_urls
    : [];

  // ✅ 1. FINAL MOTION VIDEO (NEW - TOP PRIORITY)
  if (gallery.final_video_url) {
    const clean = String(gallery.final_video_url).split("?")[0].split("#")[0];
    const ext = (clean.split(".").pop() || "mp4").toLowerCase();

    slides.push({
      key: "final-video",
      type: "video",
      url: gallery.final_video_url,
      thumbUrl: gallery.final_url || photoUrls[0] || "",
      downloadName: `final-motion.${ext}`,
    });
  }

  // ✅ 2. FINAL IMAGE
  if (gallery.final_url) {
    slides.push({
      key: "final",
      type: "image",
      url: gallery.final_url,
      thumbUrl: gallery.final_url,
      downloadName: "final-output.png",
    });
  }

  // ✅ 3. PHOTOS
  photoUrls.forEach((url, index) => {
    if (!url) return;
    slides.push({
      key: `photo-${index}`,
      type: "image",
      url,
      thumbUrl: url,
      downloadName: `photo-${index + 1}.png`,
    });
  });

  // ✅ 4. BURST VIDEOS
  burstVideoUrls.forEach((url, index) => {
    if (!url) return;

    const clean = String(url).split("?")[0].split("#")[0];
    const ext = (clean.split(".").pop() || "mp4").toLowerCase();

    slides.push({
      key: `burst-video-${index}`,
      type: "video",
      url,
      thumbUrl: gallery.final_url || photoUrls[0] || "",
      downloadName: `burst-slot-${index + 1}.${ext}`,
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

  useEffect(() => {
    const activeThumb = thumbRefs.current[activeIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    setMediaVisible(false);
    const t = setTimeout(() => setMediaVisible(true), 80);
    return () => clearTimeout(t);
  }, [activeIndex]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!items.length) return;

      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setFullscreenOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items]);

  function goPrev() {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }

  function goNext() {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }

  function handleTouchStart(e) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e) {
    touchEndX.current = e.changedTouches[0].clientX;

    if (touchStartX.current == null || touchEndX.current == null) return;

    const distance = touchStartX.current - touchEndX.current;
    const threshold = 40;

    if (distance > threshold) goNext();
    else if (distance < -threshold) goPrev();

    touchStartX.current = null;
    touchEndX.current = null;
  }

  function renderMainMedia(item, fullscreen = false) {
    const sharedStyle = fullscreen
      ? styles.fullscreenMedia
      : {
          ...styles.media,
          opacity: mediaVisible ? 1 : 0.55,
          transform: mediaVisible ? "scale(1)" : "scale(0.985)",
        };

    if (item.type === "video") {
      return (
        <video
          key={item.key}
          src={item.url}
          controls
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          style={sharedStyle}
        />
      );
    }

    return (
      <img
        key={item.key}
        src={item.url}
        alt="Gallery media"
        style={sharedStyle}
      />
    );
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
          <p style={styles.message}>No media available</p>
          <p style={styles.subMessage}>This gallery does not contain content yet.</p>
        </div>
      </main>
    );
  }

  const activeItem = items[activeIndex];
  const downloadUrl = activeItem.url;

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <img src="/logo.png" alt="Studio Photuna" style={styles.logo} />
        </header>

        <section style={styles.viewerCard}>
          <div
            style={{
              ...styles.carouselRow,
              gridTemplateColumns: isMobile ? "1fr" : "44px 1fr 44px",
            }}
          >
            {!isMobile && (
              <button onClick={goPrev} style={styles.arrowBtn} aria-label="Previous item">
                ‹
              </button>
            )}

            <div
              style={styles.mediaWrap}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                style={styles.mediaButton}
                aria-label="Open fullscreen"
              >
                {renderMainMedia(activeItem, false)}
              </button>
            </div>

            {!isMobile && (
              <button onClick={goNext} style={styles.arrowBtn} aria-label="Next item">
                ›
              </button>
            )}
          </div>

          <div style={styles.bottomArea}>
            <a
              href={downloadUrl}
              download={activeItem.downloadName}
              style={styles.downloadBtn}
            >
              Download
            </a>

            <div style={styles.dots}>
              {items.map((item, index) => (
                <button
                  key={item.key}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to item ${index + 1}`}
                  style={{
                    ...styles.dot,
                    ...(activeIndex === index ? styles.dotActive : {}),
                  }}
                />
              ))}
            </div>

            <div style={styles.thumbnailOuter}>
              <div style={styles.thumbnailFadeLeft} />
              <div style={styles.thumbnailFadeRight} />

              <div style={styles.thumbnailRow}>
                {items.map((item, index) => (
                  <button
                    key={item.key}
                    ref={(el) => {
                      thumbRefs.current[index] = el;
                    }}
                    onClick={() => setActiveIndex(index)}
                    style={{
                      ...styles.thumbBtn,
                      ...(activeIndex === index ? styles.thumbActive : {}),
                    }}
                  >
                    {item.type === "video" ? (
                      <div style={styles.videoThumbWrap}>
                        {item.thumbUrl ? (
                          <img src={item.thumbUrl} alt="" style={styles.thumbImage} />
                        ) : (
                          <div style={styles.videoThumbFallback}>Video</div>
                        )}
                        <div style={styles.videoBadge}>▶</div>
                      </div>
                    ) : (
                      <img src={item.thumbUrl || item.url} alt="" style={styles.thumbImage} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {fullscreenOpen && (
        <div style={styles.fullscreenOverlay} onClick={() => setFullscreenOpen(false)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenOpen(false);
            }}
            style={styles.closeBtn}
            aria-label="Close fullscreen"
          >
            ×
          </button>

          {!isMobile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              style={{ ...styles.fullscreenArrow, left: 12 }}
              aria-label="Previous item"
            >
              ‹
            </button>
          )}

          <div
            style={styles.fullscreenMediaWrap}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {renderMainMedia(activeItem, true)}

            <div style={styles.fullscreenActions}>
              <a
                href={downloadUrl}
                download={activeItem.downloadName}
                style={styles.fullscreenDownloadBtn}
              >
                Download
              </a>
            </div>
          </div>

          {!isMobile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              style={{ ...styles.fullscreenArrow, right: 12 }}
              aria-label="Next item"
            >
              ›
            </button>
          )}
        </div>
      )}
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
    maxWidth: "240px",
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
  mediaWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaButton: {
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  media: {
    width: "100%",
    maxHeight: "74vh",
    objectFit: "contain",
    borderRadius: "18px",
    background: "#fafafa",
    border: "1px solid #ececec",
    display: "block",
    transition: "opacity 220ms ease, transform 220ms ease",
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
  thumbnailOuter: {
    position: "relative",
    width: "100%",
  },
  thumbnailFadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "24px",
    background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0))",
    pointerEvents: "none",
    zIndex: 2,
  },
  thumbnailFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "24px",
    background: "linear-gradient(to left, #ffffff, rgba(255,255,255,0))",
    pointerEvents: "none",
    zIndex: 2,
  },
  thumbnailRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    padding: "8px 4px 2px",
    width: "100%",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  },
  thumbBtn: {
    border: "none",
    padding: 0,
    borderRadius: "10px",
    overflow: "hidden",
    background: "transparent",
    cursor: "pointer",
    flex: "0 0 auto",
    width: "70px",
    height: "70px",
    opacity: 0.6,
    transition: "opacity 180ms ease, transform 180ms ease",
  },
  thumbActive: {
    opacity: 1,
    outline: "2px solid #111111",
    transform: "scale(1.03)",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  videoThumbWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    right: "6px",
    bottom: "6px",
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
  },
  videoThumbFallback: {
    width: "100%",
    height: "100%",
    background: "#e5e7eb",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
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
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 12px",
  },
  fullscreenMediaWrap: {
    width: "100%",
    maxWidth: "1100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  fullscreenMedia: {
    width: "100%",
    maxHeight: "78vh",
    objectFit: "contain",
    borderRadius: "16px",
    display: "block",
    background: "#111",
  },
  fullscreenActions: {
    display: "flex",
    justifyContent: "center",
  },
  fullscreenDownloadBtn: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "170px",
    padding: "13px 20px",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#111111",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "15px",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    border: "none",
    background: "#ffffff",
    color: "#111111",
    fontSize: "30px",
    lineHeight: 1,
    cursor: "pointer",
  },
  fullscreenArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    border: "none",
    background: "#ffffff",
    color: "#111111",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
  },
};
