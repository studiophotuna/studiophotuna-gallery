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
          <div style={styles.heroMetaRow}>
            <div style={styles.heroPill}>QR Gallery</div>
            <div style={styles.heroPill}>{shotCount} Shots</div>
            <div style={styles.heroPill}>{items.length} Media</div>
            {isExpired ? <div style={styles.heroPillWarning}>Expired</div> : null}
          </div>

          <div style={styles.topBar}>
            <div style={styles.topBarLeft}>
              <div style={styles.labelRow}>
                <span style={styles.activeBadge}>{activeItem.badge || "Media"}</span>
                <span style={styles.counter}>{activeIndex + 1} / {items.length}</span>
              </div>
              <h2 style={styles.title}>{activeItem.label}</h2>
              <p style={styles.description}>
                Tap the preview to open fullscreen, or download the selected item directly.
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
                <p style={styles.sideCardLabel}>Session Preview</p>
                <div style={styles.sideInfoList}>
                  <div style={styles.sideInfoItem}>
                    <span style={styles.sideInfoKey}>Current type</span>
                    <span style={styles.sideInfoValue}>{activeItem.type === "video" ? "Video" : "Image"}</span>
                  </div>
                  <div style={styles.sideInfoItem}>
                    <span style={styles.sideInfoKey}>Best for</span>
                    <span style={styles.sideInfoValue}>
                      {activeItem.key === "final"
                        ? "Printing / sharing"
                        : activeItem.key === "final-video"
                        ? "Social posting"
                        : activeItem.key.includes("burst")
                        ? "Motion preview"
                        : "Raw memory"}
                    </span>
                  </div>
                </div>
              </div>

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
      "radial-gradient(circle at top, rgba(255,225,236,0.55) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, #fff8fb 0%, #f7f4ff 40%, #f4f7fb 100%)",
    padding: "16px 12px 32px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: "hidden",
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 780,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0))",
    pointerEvents: "none",
  },
  bgGlowBottom: {
    position: "absolute",
    right: -120,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(235,240,255,0.9), rgba(235,240,255,0))",
    pointerEvents: "none",
  },
  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: 1220,
    margin: "0 auto",
    zIndex: 1,
  },
  header: {
    marginBottom: 16,
  },
  brandWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    textAlign: "center",
  },
  logo: {
    width: "100%",
    maxWidth: 168,
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.08))",
  },
  brandTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: 720,
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
    fontSize: "clamp(26px, 4vw, 42px)",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    color: "#231a2c",
  },
  brandSubtext: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#6b7280",
  },
  heroCard: {
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: 28,
    padding: 16,
    border: "1px solid rgba(35,26,44,0.08)",
    boxShadow: "0 20px 60px rgba(31, 41, 55, 0.10)",
  },
  heroMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(35,26,44,0.08)",
    fontSize: 12,
    fontWeight: 700,
    color: "#4b5563",
  },
  heroPillWarning: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(255,244,230,1)",
    border: "1px solid rgba(245,158,11,0.2)",
    fontSize: 12,
    fontWeight: 800,
    color: "#b45309",
  },
  topBar: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 16,
  },
  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  counter: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
  },
  title: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 34px)",
    lineHeight: 1.04,
    color: "#111827",
    letterSpacing: "-0.04em",
  },
  description: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#6b7280",
    maxWidth: 580,
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
    minHeight: 48,
    borderRadius: 999,
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 14px 30px rgba(17, 24, 39, 0.18)",
  },
  viewerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  mediaStage: {
    position: "relative",
    minWidth: 0,
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(17,24,39,0.08)",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
    zIndex: 3,
  },
  arrowLeft: {
    left: 10,
  },
  arrowRight: {
    right: 10,
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
    padding: 10,
    borderRadius: 28,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(247,244,255,0.92) 100%)",
    border: "1px solid rgba(17,24,39,0.06)",
    boxShadow: "0 20px 50px rgba(17, 24, 39, 0.10)",
  },
  mediaFrameInner: {
    position: "relative",
    width: "100%",
    minHeight: 320,
    aspectRatio: "4 / 5",
    borderRadius: 22,
    overflow: "hidden",
    background: "linear-gradient(180deg, #fbfbfd 0%, #f3f4f6 100%)",
  },
  mediaSkeleton: {
    position: "absolute",
    inset: 10,
    borderRadius: 22,
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
    gap: 14,
  },
  sideCard: {
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(17,24,39,0.06)",
    borderRadius: 22,
    padding: 14,
    boxShadow: "0 12px 30px rgba(17, 24, 39, 0.06)",
  },
  sideCardLabel: {
    margin: "0 0 10px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#9a6b84",
  },
  sideInfoList: {
    display: "grid",
    gap: 10,
  },
  sideInfoItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 16,
    background: "#f9fafb",
    border: "1px solid rgba(17,24,39,0.05)",
  },
  sideInfoKey: {
    fontSize: 13,
    color: "#6b7280",
  },
  sideInfoValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    textAlign: "right",
  },
  thumbHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
  },
  thumbHeaderTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
  },
  thumbHeaderSubtext: {
    fontSize: 12,
    color: "#6b7280",
  },
  thumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  thumbBtn: {
    border: "1px solid rgba(17,24,39,0.06)",
    background: "#fff",
    borderRadius: 18,
    padding: 8,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    textAlign: "left",
    boxShadow: "0 10px 22px rgba(17, 24, 39, 0.05)",
  },
  thumbActive: {
    border: "1px solid rgba(17,24,39,0.16)",
    transform: "translateY(-1px)",
    boxShadow: "0 14px 30px rgba(17, 24, 39, 0.10)",
  },
  thumbFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 14,
    overflow: "hidden",
    background: "#f3f4f6",
  },
  thumbImage: {
    objectFit: "cover",
  },
  thumbTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  thumbCaption: {
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#111827",
  },
  thumbSubcaption: {
    fontSize: 11,
    color: "#6b7280",
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
    gap: 6,
  },
  videoThumbIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  videoThumbLabel: {
    fontSize: 10,
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
    fontSize: 24,
    lineHeight: 1.08,
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
