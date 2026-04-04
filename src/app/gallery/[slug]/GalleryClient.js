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
        label: `Shot ${index + 1}`,
        badge: "Photo",
        downloadName: `photo-${index + 1}${getFileExtension(url, "png")}`,
        type: inferMediaType(url),
      });
    });

    if (gallery.final_url) {
      slides.push({
        key: "final",
        url: gallery.final_url,
        thumbUrl: gallery.final_url,
        label: "Final Layout",
        badge: "Layout",
        downloadName: `final-layout${getFileExtension(gallery.final_url, "png")}`,
        type: inferMediaType(gallery.final_url),
      });
    }

    if (gallery.final_video_url) {
      slides.push({
        key: "final-video",
        url: gallery.final_video_url,
        thumbUrl: gallery.final_url || gallery.photo_urls?.[0] || "",
        label: "Final Motion",
        badge: "Video",
        downloadName: `final-motion${getFileExtension(gallery.final_video_url, "webm")}`,
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
        thumbUrl: gallery.photo_urls?.[index] || url,
        label: `Burst ${index + 1}`,
        badge: "Burst",
        downloadName: `burst-${index + 1}${getFileExtension(url, "mp4")}`,
        type: inferMediaType(url),
        autoplay: true,
        loop: true,
        muted: true,
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
          <StateCard title="Unable to load gallery" text={errorText} />
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <StateCard
            title="Gallery not found"
            text="The link may be invalid or the gallery is no longer available."
          />
        </div>
      </main>
    );
  }

  if (!items.length || !activeItem) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <StateCard
            title="No media available"
            text="This gallery does not contain any photos yet."
          />
        </div>
      </main>
    );
  }

  const isExpired = Boolean(
    gallery.expires_at && new Date(gallery.expires_at).getTime() < Date.now()
  );

  const shotCount = Array.isArray(gallery.photo_urls) ? gallery.photo_urls.filter(Boolean).length : 0;

  return (
    <main style={styles.page}>
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <div style={styles.wrapper}>
        <header style={styles.header}>
          <div style={styles.brandWrap}>
            <img src="/logo.png" alt="Studio Photuna" style={styles.logo} />
            <div style={styles.brandTextWrap}>
              <p style={styles.brandEyebrow}>Photo Booth Gallery</p>
              <h1 style={styles.brandTitle}>Your Moments, Ready to Save</h1>
              <p style={styles.brandSubtext}>
                Preview the raw shots, final layout, and motion output from your session.
              </p>
            </div>
          </div>
        </header>

        <section style={styles.heroCard}>
          <div style={styles.topBar}>
            <div style={styles.topBarLeft}>
              <div style={styles.labelRow}>
                <span style={styles.activeBadge}>{activeItem.badge || "Media"}</span>
                <span style={styles.counter}>{activeIndex + 1} / {items.length}</span>
              </div>
              <h2 style={styles.title}>{activeItem.label}</h2>
              <p style={styles.description}>
                tap, swipe, save ✨
              </p>
            </div>

            <div style={styles.topActions}>
              <a href={activeItem.url} download={activeItem.downloadName} style={styles.downloadBtn}>
                Download Selected
              </a>
            </div>
          </div>

          <div style={styles.viewerGrid}>
            <div style={styles.mediaStage} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <button
                type="button"
                onClick={goPrev}
                style={{ ...styles.arrowBtn, ...styles.arrowLeft }}
                aria-label="Previous item"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={goNext}
                style={{ ...styles.arrowBtn, ...styles.arrowRight }}
                aria-label="Next item"
              >
                ›
              </button>

              {!mainLoaded && <div style={styles.mediaSkeleton} />}

              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                style={styles.mediaButton}
                aria-label={`Open ${activeItem.label} in fullscreen`}
              >
                <div style={styles.mediaFrameOuter}>
                  <div style={styles.mediaFrameInner}>
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
                </div>
              </button>
            </div>

            <aside style={styles.sidePanel}>
              <div style={styles.sideCard}>
                <div style={styles.thumbHeader}>
                  <span style={styles.thumbHeaderTitle}>Session Media</span>
                  <span style={styles.thumbHeaderSubtext}>Select any frame below</span>
                </div>

                <div style={styles.thumbnailGrid}>
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
                              <span style={styles.videoThumbLabel}>{item.badge}</span>
                            </div>
                          ) : (
                            <Image
                              src={item.thumbUrl || item.url}
                              alt={item.label}
                              fill
                              loading="lazy"
                              sizes="120px"
                              style={styles.thumbImage}
                            />
                          )}
                        </div>

                        <div style={styles.thumbTextWrap}>
                          <span style={styles.thumbCaption}>{item.label}</span>
                          <span style={styles.thumbSubcaption}>{item.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {fullscreenOpen && (
        <div
          style={styles.fullscreenOverlay}
          onClick={() => setFullscreenOpen(false)}
          role="dialog"
          aria-modal="true"
        >
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
                <p style={styles.fullscreenKicker}>{activeItem.badge}</p>
                <h2 style={styles.fullscreenTitle}>{activeItem.label}</h2>
              </div>

              <a href={activeItem.url} download={activeItem.downloadName} style={styles.fullscreenDownloadBtn}>
                Download
              </a>
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
                  loop={activeItem.loop ?? true}
                  muted={activeItem.muted ?? true}
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

function StateCard({ title, text }) {
  return (
    <div style={styles.stateCard}>
      <p style={styles.stateTitle}>{title}</p>
      <p style={styles.stateText}>{text}</p>
    </div>
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
    background:
      "radial-gradient(circle at top, rgba(255,225,236,0.48) 0%, rgba(255,255,255,0) 28%), linear-gradient(180deg, #fff9fb 0%, #f7f5ff 42%, #f4f7fb 100%)",
    padding: "14px 12px 28px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: "hidden",
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 760,
    height: 280,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.94), rgba(255,255,255,0))",
    pointerEvents: "none",
  },
  bgGlowBottom: {
    position: "absolute",
    right: -100,
    bottom: -120,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(236,240,255,0.78), rgba(236,240,255,0))",
    pointerEvents: "none",
  },
  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
    zIndex: 1,
  },
  header: {
    marginBottom: 14,
  },
  brandWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
  },
  logo: {
    width: "100%",
    maxWidth: 152,
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.08))",
  },
  brandTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    maxWidth: 560,
  },
  brandEyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#9a6b84",
  },
  brandTitle: {
    margin: 0,
    fontSize: "clamp(26px, 4vw, 40px)",
    lineHeight: 1,
    letterSpacing: "-0.045em",
    color: "#231a2c",
  },
  brandSubtext: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#7a7f8a",
  },
  heroCard: {
    background: "rgba(255,255,255,0.74)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: 26,
    padding: 14,
    border: "1px solid rgba(35,26,44,0.06)",
    boxShadow: "0 16px 44px rgba(31, 41, 55, 0.08)",
  },
  heroMetaRow: {
    display: "none",
  },
  heroPill: {
    display: "none",
  },
  heroPillWarning: {
    display: "none",
  },
  topBar: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 14,
  },
  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
    textAlign: "center",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 26,
    padding: "0 10px",
    borderRadius: 999,
    background: "rgba(17,24,39,0.92)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  counter: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8a8f98",
  },
  title: {
    margin: 0,
    fontSize: "clamp(22px, 3vw, 30px)",
    lineHeight: 1.02,
    color: "#111827",
    letterSpacing: "-0.045em",
  },
  description: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.55,
    color: "#7a7f8a",
    maxWidth: 420,
  },
  topActions: {
    display: "flex",
    width: "100%",
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 46,
    borderRadius: 999,
    background: "linear-gradient(135deg, #111827 0%, #2b3444 100%)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 12px 24px rgba(17, 24, 39, 0.14)",
  },
  viewerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  mediaStage: {
    position: "relative",
    minWidth: 0,
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(17,24,39,0.06)",
    background: "rgba(255,255,255,0.94)",
    color: "#111827",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
    zIndex: 3,
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
  mediaButton: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  mediaFrameOuter: {
    padding: 8,
    borderRadius: 24,
    background: "rgba(255,255,255,0.84)",
    border: "1px solid rgba(17,24,39,0.05)",
    boxShadow: "0 16px 36px rgba(17, 24, 39, 0.08)",
  },
  mediaFrameInner: {
    position: "relative",
    width: "100%",
    minHeight: 320,
    aspectRatio: "4 / 5",
    borderRadius: 18,
    overflow: "hidden",
    background: "linear-gradient(180deg, #fbfbfd 0%, #f3f4f6 100%)",
  },
  mediaSkeleton: {
    position: "absolute",
    inset: 8,
    borderRadius: 18,
    background:
      "linear-gradient(90deg, rgba(243,244,246,1) 25%, rgba(229,231,235,1) 37%, rgba(243,244,246,1) 63%)",
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
  sidePanel: {
    display: "grid",
    gap: 10,
  },
  sideCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(17,24,39,0.05)",
    borderRadius: 20,
    padding: 12,
    boxShadow: "0 10px 24px rgba(17, 24, 39, 0.05)",
  },
  sideCardLabel: {
    display: "none",
  },
  sideInfoList: {
    display: "none",
  },
  sideInfoItem: {
    display: "none",
  },
  sideInfoKey: {
    display: "none",
  },
  sideInfoValue: {
    display: "none",
  },
  thumbHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 10,
  },
  thumbHeaderTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
  },
  thumbHeaderSubtext: {
    fontSize: 11,
    color: "#8a8f98",
  },
  thumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  thumbBtn: {
    border: "1px solid rgba(17,24,39,0.05)",
    background: "#fff",
    borderRadius: 16,
    padding: 6,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    textAlign: "left",
    boxShadow: "0 8px 18px rgba(17, 24, 39, 0.04)",
  },
  thumbActive: {
    border: "1px solid rgba(17,24,39,0.14)",
    transform: "translateY(-1px)",
    boxShadow: "0 12px 24px rgba(17, 24, 39, 0.08)",
  },
  thumbFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 12,
    overflow: "hidden",
    background: "#f3f4f6",
  },
  thumbImage: {
    objectFit: "cover",
  },
  thumbTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  thumbCaption: {
    fontSize: 11,
    lineHeight: 1.25,
    fontWeight: 700,
    color: "#111827",
  },
  thumbSubcaption: {
    fontSize: 10,
    color: "#8a8f98",
  },
  videoThumb: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
    color: "#fff",
    gap: 5,
  },
  videoThumbIcon: {
    fontSize: 16,
    lineHeight: 1,
  },
  videoThumbLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  stateCard: {
    maxWidth: 560,
    margin: "80px auto 0",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    border: "1px solid rgba(17,24,39,0.06)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
    padding: "24px 18px",
    textAlign: "center",
  },
  stateTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  stateText: {
    margin: "10px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.94)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 10px",
  },
  fullscreenContent: {
    width: "100%",
    maxWidth: 1200,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fullscreenTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    color: "#fff",
  },
  fullscreenKicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.66)",
  },
  fullscreenTitle: {
    margin: "4px 0 0",
    fontSize: 22,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
  },
  fullscreenFrame: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  fullscreenMedia: {
    width: "100%",
    maxHeight: "78vh",
    objectFit: "contain",
    display: "block",
    background: "transparent",
  },
  fullscreenDownloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 18px",
    borderRadius: 999,
    background: "#ffffff",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 5,
  },
  fullscreenArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 5,
  },
};
