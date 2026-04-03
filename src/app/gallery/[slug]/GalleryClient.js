"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SWIPE_THRESHOLD = 40;

export default function GalleryClient({ gallery, initialError = "" }) {
  const [errorText] = useState(initialError);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [mainLoaded, setMainLoaded] = useState(false);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const thumbRefs = useRef([]);

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
        thumbUrl: url,
        label: `Photo ${index + 1}`,
        downloadName: `photo-${index + 1}${getFileExtension(url, "png")}`,
        type: inferMediaType(url),
      });
    });

    if (gallery.final_url) {
      slides.push({
        key: "final",
        url: gallery.final_url,
        thumbUrl: gallery.final_url,
        label: "Final Output",
        downloadName: `final-output${getFileExtension(gallery.final_url, "png")}`,
        type: inferMediaType(gallery.final_url),
      });
    }

    if (gallery.final_video_url) {
    slides.push({
      key: "final-video",
      url: gallery.final_video_url,
      thumbUrl: gallery.final_url || gallery.photo_urls?.[0] || "",
      label: "Final Video",
      downloadName: `final-video${getFileExtension(gallery.final_video_url, "mp4")}`,
      type: inferMediaType(gallery.final_video_url),
    autoplay: true,
    loop: true,
    muted: true,
    });
  }

    burstUrls.forEach((url, index) => {
      if (!url) return;
      slides.push({
        key: `burst-${index}`,
        url,
        thumbUrl: url,
        label: `Burst ${index + 1}`,
        downloadName: `burst-${index + 1}${getFileExtension(url, "png")}`,
        type: inferMediaType(url),
      });
    });

    return slides;
  }, [gallery]);

  const activeItem = items[activeIndex] || null;

  useEffect(() => {
    setMainLoaded(false);
  }, [activeIndex]);

  useEffect(() => {
    const activeThumb = thumbRefs.current[activeIndex];
    activeThumb?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    if (!items.length) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  useEffect(() => {
    if (!items.length || !activeItem) return;

    const nextIndex = (activeIndex + 1) % items.length;
    const prevIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    const neighbors = [items[prevIndex], items[nextIndex]];

    neighbors.forEach((item) => {
      if (!item?.url) return;

      if (item.type === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = item.url;
      } else {
        const img = new window.Image();
        img.decoding = "async";
        img.src = item.url;
      }
    });
  }, [activeIndex, activeItem, items]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!items.length) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setFullscreenOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, items.length]);

  function handleTouchStart(e) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e) {
    touchEndX.current = e.changedTouches[0].clientX;

    if (touchStartX.current == null || touchEndX.current == null) return;

    const distance = touchStartX.current - touchEndX.current;
    if (distance > SWIPE_THRESHOLD) goNext();
    if (distance < -SWIPE_THRESHOLD) goPrev();

    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (errorText) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Unable to load gallery</p>
            <p style={styles.stateText}>{errorText}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Gallery not found</p>
            <p style={styles.stateText}>
              The link may be invalid or the gallery is no longer available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!items.length || !activeItem) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>No media available</p>
            <p style={styles.stateText}>This gallery does not contain any photos yet.</p>
          </div>
        </div>
      </main>
    );
  }

  const isExpired = Boolean(
    gallery.expires_at && new Date(gallery.expires_at).getTime() < Date.now()
  );

  return (
    <main style={styles.page}>
      <div style={styles.shellGradient} />
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <img src="/logo.png" alt="Studio Photuna" style={styles.logo} />
        </header>

        <section style={styles.viewerCard}>
          <div style={styles.topBar}>
            <div style={styles.topBarLeft}>
              <p style={styles.kicker}>Studio Photuna Gallery</p>
              <h1 style={styles.title}>{activeItem.label}</h1>
              <div style={styles.metaRow}>
                <span style={styles.counter}>
                  {activeIndex + 1} / {items.length}
                </span>
                <span style={styles.metaDivider}>•</span>
                <span style={styles.metaType}>
                  {activeItem.type === "video" ? "Video" : "Image"}
                </span>
                {isExpired ? (
                  <>
                    <span style={styles.metaDivider}>•</span>
                    <span style={styles.expiredText}>Expired</span>
                  </>
                ) : null}
              </div>
            </div>

            <div style={styles.topActions}>
              <a href={activeItem.url} download={activeItem.downloadName} style={styles.downloadBtn}>
                Download
              </a>
            </div>
          </div>

          <div style={styles.viewerRow}>
            <button type="button" onClick={goPrev} style={styles.arrowBtn} aria-label="Previous item">
              ‹
            </button>

            <div style={styles.mediaStage} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {!mainLoaded && <div style={styles.mediaSkeleton} />}

              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                style={styles.mediaButton}
                aria-label={`Open ${activeItem.label} in fullscreen`}
              >
                <div style={styles.mediaFrame}>
                  {activeItem.type === "video" ? (
                    <video
                      key={activeItem.key}
                      src={activeItem.url}
                      style={styles.media}
                      playsInline
                      preload="metadata"
                      autoPlay={activeItem.autoplay}
                      loop={activeItem.loop}
                      muted={activeItem.muted}
                      controls={!activeItem.autoplay}
                      onLoadedData={() => setMainLoaded(true)}
                    />
                  ) : (
                    <Image
                      key={activeItem.key}
                      src={activeItem.url}
                      alt={activeItem.label}
                      fill
                      priority={activeIndex === 0}
                      sizes="(max-width: 768px) 100vw, 960px"
                      style={styles.mediaImage}
                      onLoad={() => setMainLoaded(true)}
                    />
                  )}
                </div>
              </button>
            </div>

            <button type="button" onClick={goNext} style={styles.arrowBtn} aria-label="Next item">
              ›
            </button>
          </div>

          <div style={styles.thumbSection}>
            <div style={styles.thumbHeader}>
              <span style={styles.thumbHeaderTitle}>All Media</span>
              <span style={styles.thumbHeaderSubtext}>Tap any thumbnail to preview</span>
            </div>

            <div style={styles.thumbnailOuter}>
              <div style={styles.thumbnailFadeLeft} />
              <div style={styles.thumbnailFadeRight} />
              <div style={styles.thumbnailRow}>
                {items.map((item, index) => {
                  const active = index === activeIndex;

                  return (
                    <button
                      key={item.key}
                      ref={(el) => {
                        thumbRefs.current[index] = el;
                      }}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      style={{
                        ...styles.thumbBtn,
                        ...(active ? styles.thumbActive : {}),
                      }}
                      aria-label={`Open ${item.label}`}
                      aria-pressed={active}
                    >
                      <div style={styles.thumbFrame}>
                        {item.type === "video" ? (
                          <div style={styles.videoThumb}>
                            <span style={styles.videoThumbIcon}>▶</span>
                            <span style={styles.videoThumbLabel}>Video</span>
                          </div>
                        ) : (
                          <Image
                            src={item.thumbUrl}
                            alt={item.label}
                            fill
                            loading="lazy"
                            sizes="72px"
                            style={styles.thumbImage}
                          />
                        )}
                      </div>

                      <span style={styles.thumbCaption}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {fullscreenOpen && (
        <div style={styles.fullscreenOverlay} onClick={() => setFullscreenOpen(false)} role="dialog" aria-modal="true">
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

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            style={{ ...styles.fullscreenArrow, left: 18 }}
            aria-label="Previous item"
          >
            ‹
          </button>

          <div
            style={styles.fullscreenContent}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div style={styles.fullscreenTopBar}>
              <div>
                <p style={styles.fullscreenKicker}>Preview</p>
                <h2 style={styles.fullscreenTitle}>{activeItem.label}</h2>
              </div>

              <div style={styles.fullscreenCounter}>
                {activeIndex + 1} / {items.length}
              </div>
            </div>

            <div style={styles.fullscreenFrame}>
              {activeItem.type === "video" ? (
                <video
                  key={`fullscreen-${activeItem.key}`}
                  src={activeItem.url}
                  style={styles.fullscreenMedia}
                  playsInline
                  preload="metadata"
                  autoPlay={activeItem.autoplay ?? true}
                  loop={activeItem.loop ?? false}
                  muted={activeItem.muted ?? false}
                  controls={!activeItem.autoplay}
                />
              ) : (
                <img
                  key={`fullscreen-${activeItem.key}`}
                  src={activeItem.url}
                  alt={activeItem.label}
                  style={styles.fullscreenMedia}
                />
              )}
            </div>

            <div style={styles.fullscreenActions}>
              <a href={activeItem.url} download={activeItem.downloadName} style={styles.fullscreenDownloadBtn}>
                Download
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            style={{ ...styles.fullscreenArrow, right: 18 }}
            aria-label="Next item"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}

function inferMediaType(url = "") {
  const cleanUrl = url.split("?")[0].toLowerCase();

  if (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".m4v")
  ) {
    return "video";
  }

  return "image";
}

function getFileExtension(url = "", fallback = "png") {
  try {
    const cleanUrl = url.split("?")[0];
    const match = cleanUrl.match(/(\.[a-zA-Z0-9]+)$/);
    return match ? match[1] : `.${fallback}`;
  } catch {
    return `.${fallback}`;
  }
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8f9fb 0%, #f3f4f6 42%, #eef1f4 100%)",
    padding: "20px 14px 40px",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: "hidden",
  },
  shellGradient: {
    position: "absolute",
    inset: "0 auto auto 50%",
    transform: "translateX(-50%)",
    width: "1200px",
    height: "320px",
    background: "radial-gradient(circle at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 72%)",
    pointerEvents: "none",
  },
  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "18px",
    paddingTop: "6px",
  },
  logo: {
    maxWidth: "220px",
    width: "100%",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.05))",
  },
  viewerCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "30px",
    padding: "22px",
    border: "1px solid rgba(17,17,17,0.06)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  kicker: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#7a7f87",
  },
  title: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 34px)",
    lineHeight: 1.08,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    color: "#6b7280",
    fontSize: "14px",
  },
  counter: {
    fontWeight: 600,
    color: "#374151",
  },
  metaDivider: {
    opacity: 0.55,
  },
  metaType: {
    color: "#6b7280",
  },
  expiredText: {
    color: "#b45309",
    fontWeight: 600,
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "150px",
    height: "46px",
    padding: "0 18px",
    borderRadius: "999px",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "-0.01em",
    boxShadow: "0 10px 24px rgba(17, 24, 39, 0.16)",
  },
  viewerRow: {
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr) 48px",
    alignItems: "center",
    gap: "14px",
  },
  arrowBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    border: "1px solid rgba(17,24,39,0.08)",
    background: "rgba(255,255,255,0.94)",
    color: "#111827",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  mediaStage: {
    position: "relative",
    minWidth: 0,
  },
  mediaButton: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  mediaFrame: {
    position: "relative",
    width: "100%",
    minHeight: "420px",
    aspectRatio: "4 / 5",
    borderRadius: "24px",
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(243,244,246,1) 100%)",
    border: "1px solid rgba(17,24,39,0.06)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  mediaSkeleton: {
    position: "absolute",
    inset: 0,
    borderRadius: "24px",
    background: "linear-gradient(90deg, rgba(243,244,246,1) 25%, rgba(229,231,235,1) 37%, rgba(243,244,246,1) 63%)",
    backgroundSize: "400% 100%",
    animation: "shimmer 1.4s ease infinite",
    zIndex: 1,
  },
  media: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#f9fafb",
  },
  mediaImage: {
    objectFit: "contain",
  },
  thumbSection: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(17,24,39,0.06)",
  },
  thumbHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  thumbHeaderTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#111827",
  },
  thumbHeaderSubtext: {
    fontSize: "13px",
    color: "#6b7280",
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
    width: "26px",
    background: "linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0))",
    pointerEvents: "none",
    zIndex: 2,
  },
  thumbnailFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "26px",
    background: "linear-gradient(to left, rgba(255,255,255,0.9), rgba(255,255,255,0))",
    pointerEvents: "none",
    zIndex: 2,
  },
  thumbnailRow: {
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    padding: "4px 2px 6px",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  },
  thumbBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    flex: "0 0 auto",
    width: "86px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    opacity: 0.72,
    transition: "transform 180ms ease, opacity 180ms ease",
  },
  thumbActive: {
    opacity: 1,
    transform: "translateY(-1px)",
  },
  thumbFrame: {
    position: "relative",
    width: "86px",
    height: "86px",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#f3f4f6",
    border: "1px solid rgba(17,24,39,0.08)",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  thumbImage: {
    objectFit: "cover",
  },
  thumbCaption: {
    display: "block",
    fontSize: "12px",
    lineHeight: 1.25,
    fontWeight: 600,
    color: "#374151",
    textAlign: "center",
  },
  videoThumb: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgba(31,41,55,1) 0%, rgba(17,24,39,1) 100%)",
    color: "#fff",
    gap: "4px",
  },
  videoThumbIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  videoThumbLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  stateCard: {
    maxWidth: "600px",
    margin: "100px auto 0",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderRadius: "28px",
    border: "1px solid rgba(17,24,39,0.06)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
    padding: "32px 24px",
    textAlign: "center",
  },
  stateTitle: {
    margin: 0,
    fontSize: "26px",
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  stateText: {
    margin: "10px 0 0",
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.92)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
  },
  fullscreenContent: {
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fullscreenTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    color: "#fff",
  },
  fullscreenKicker: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.66)",
  },
  fullscreenTitle: {
    margin: "6px 0 0",
    fontSize: "clamp(22px, 3vw, 30px)",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  },
  fullscreenCounter: {
    fontSize: "14px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.86)",
  },
  fullscreenFrame: {
    width: "100%",
    borderRadius: "24px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  fullscreenMedia: {
    width: "100%",
    maxHeight: "76vh",
    objectFit: "contain",
    display: "block",
    background: "transparent",
  },
  fullscreenActions: {
    display: "flex",
    justifyContent: "center",
  },
  fullscreenDownloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "160px",
    height: "46px",
    padding: "0 18px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1,
    cursor: "pointer",
  },
  fullscreenArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "52px",
    height: "52px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1,
    cursor: "pointer",
  },
};
