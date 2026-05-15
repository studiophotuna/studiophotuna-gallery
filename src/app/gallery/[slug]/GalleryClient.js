"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function GalleryClient({ gallery, initialError = "" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridOpen, setGridOpen] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(true);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const items = useMemo(() => {
    if (!gallery) return [];

    const slides = [];
    const photoUrls = Array.isArray(gallery.photo_urls) ? gallery.photo_urls : [];

    if (gallery.final_url) {
      slides.push({
        key: "final",
        url: gallery.final_url,
        downloadName: "final-output.png",
        type: "image",
        label: "Final",
      });
    }

    if (gallery.final_video_url) {
      slides.push({
        key: "final-video",
        url: gallery.final_video_url,
        downloadName: "final-motion.webm",
        type: "video",
        label: "Motion",
      });
    }

    photoUrls.forEach((url, index) => {
      if (!url) return;
      slides.push({
        key: `photo-${index}`,
        url,
        downloadName: `photo-${index + 1}.png`,
        type: "image",
        label: `Photo ${index + 1}`,
      });
    });

    return slides;
  }, [gallery]);

  useEffect(() => {
    if (activeIndex > Math.max(items.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    setMediaVisible(false);
    const timer = setTimeout(() => setMediaVisible(true), 80);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!items.length) return;
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Escape") setGridOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function goPrev() {
    if (!items.length) return;
    setActiveIndex((current) => (current === 0 ? items.length - 1 : current - 1));
  }

  function goNext() {
    if (!items.length) return;
    setActiveIndex((current) => (current === items.length - 1 ? 0 : current + 1));
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current == null || touchStartY.current == null) return;

    const touch = event.changedTouches[0];
    const diffX = touchStartX.current - touch.clientX;
    const diffY = touchStartY.current - touch.clientY;

    if (Math.abs(diffX) > 42 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) goNext();
      else goPrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  async function shareActiveItem() {
    const item = items[activeIndex];
    if (!item?.url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Studio Photuna",
          text: "View my Studio Photuna photo booth gallery.",
          url: item.url,
        });
      } catch {
        // Share sheet was cancelled.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(item.url);
    } catch {
      window.prompt("Copy this link", item.url);
    }
  }

  if (initialError) {
    return <StatusView title="Unable to load gallery." detail={initialError} />;
  }

  if (!gallery) {
    return (
      <StatusView
        title="Gallery not found"
        detail="The link may be invalid or the gallery is not available."
      />
    );
  }

  if (!items.length) {
    return (
      <StatusView
        title="No photos available"
        detail="This gallery does not contain images yet."
      />
    );
  }

  const activeItem = items[activeIndex];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <img src="/logo.png" alt="Studio Photuna" style={styles.logo} />
        <div style={styles.counter}>
          {activeIndex + 1} / {items.length}
        </div>
      </header>

      <section
        style={styles.viewer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeItem.type === "video" ? (
          <video
            src={activeItem.url}
            controls
            playsInline
            loop
            style={{
              ...styles.media,
              opacity: mediaVisible ? 1 : 0.5,
              transform: mediaVisible ? "scale(1)" : "scale(0.985)",
            }}
          />
        ) : (
          <img
            src={activeItem.url}
            alt="Gallery item"
            style={{
              ...styles.media,
              opacity: mediaVisible ? 1 : 0.5,
              transform: mediaVisible ? "scale(1)" : "scale(0.985)",
            }}
          />
        )}
      </section>

      <section style={styles.infoBar}>
        <div>
          <div style={styles.itemLabel}>{activeItem.label}</div>
          <div style={styles.itemMeta}>Swipe to browse</div>
        </div>
        <button type="button" onClick={() => setGridOpen(true)} style={styles.allButton}>
          All
        </button>
      </section>

      <nav style={styles.actionBar} aria-label="Gallery actions">
        <button type="button" onClick={goPrev} style={styles.iconButton} aria-label="Previous">
          &lsaquo;
        </button>
        <a href={activeItem.url} download={activeItem.downloadName} style={styles.downloadBtn}>
          Download
        </a>
        <button type="button" onClick={shareActiveItem} style={styles.shareBtn}>
          Share
        </button>
        <button type="button" onClick={goNext} style={styles.iconButton} aria-label="Next">
          &rsaquo;
        </button>
      </nav>

      {gridOpen && (
        <div style={styles.sheetBackdrop} onClick={() => setGridOpen(false)}>
          <div style={styles.sheet} onClick={(event) => event.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <div>
                <div style={styles.sheetTitle}>All media</div>
                <div style={styles.sheetSubtitle}>
                  {items.length} item{items.length === 1 ? "" : "s"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGridOpen(false)}
                style={styles.closeSheetBtn}
                aria-label="Close media list"
              >
                &times;
              </button>
            </div>

            <div style={styles.mediaGrid}>
              {items.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    setGridOpen(false);
                  }}
                  style={{
                    ...styles.gridItem,
                    ...(activeIndex === index ? styles.gridItemActive : {}),
                  }}
                >
                  {item.type === "video" ? (
                    <video src={item.url} muted playsInline style={styles.gridThumb} />
                  ) : (
                    <img src={item.url} alt="" style={styles.gridThumb} />
                  )}
                  <span style={styles.gridLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusView({ title, detail }) {
  return (
    <main style={styles.statusPage}>
      <div style={styles.statusCard}>
        <img src="/logo.png" alt="Studio Photuna" style={styles.statusLogo} />
        <p style={styles.statusTitle}>{title}</p>
        {detail && <p style={styles.statusDetail}>{detail}</p>}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    height: "100dvh",
    overflow: "hidden",
    background: "#050505",
    color: "#ffffff",
    display: "grid",
    gridTemplateRows: "64px minmax(0, 1fr) 62px 82px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px max(16px, env(safe-area-inset-left)) 8px max(16px, env(safe-area-inset-left))",
    background: "rgba(5,5,5,0.92)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logo: {
    width: "150px",
    maxWidth: "48vw",
    height: "auto",
    objectFit: "contain",
    filter: "brightness(1.08)",
  },
  counter: {
    minWidth: 54,
    borderRadius: 999,
    padding: "7px 11px",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },
  viewer: {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 0",
    touchAction: "pan-y",
    background: "#050505",
  },
  media: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    transition: "opacity 180ms ease, transform 180ms ease",
    background: "#050505",
  },
  infoBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(5,5,5,0.94)",
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.58)",
  },
  allButton: {
    height: 40,
    minWidth: 58,
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
  },
  actionBar: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 0.72fr 44px",
    alignItems: "center",
    gap: 10,
    padding:
      "10px max(14px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))",
    background: "#ffffff",
    boxShadow: "0 -12px 30px rgba(0,0,0,0.26)",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111111",
    fontSize: 30,
    lineHeight: 1,
  },
  downloadBtn: {
    height: 48,
    borderRadius: 999,
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    height: 48,
    borderRadius: 999,
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#111111",
    fontSize: 15,
    fontWeight: 900,
  },
  sheetBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "flex-end",
    background: "rgba(0,0,0,0.58)",
  },
  sheet: {
    width: "100%",
    maxHeight: "76dvh",
    overflow: "hidden",
    borderRadius: "22px 22px 0 0",
    background: "#ffffff",
    color: "#111111",
    boxShadow: "0 -16px 50px rgba(0,0,0,0.36)",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "18px 18px 12px",
    borderBottom: "1px solid #eeeeee",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  sheetSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#71717a",
  },
  closeSheetBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111111",
    fontSize: 24,
    lineHeight: 1,
  },
  mediaGrid: {
    maxHeight: "calc(76dvh - 78px)",
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    padding: "14px 14px calc(18px + env(safe-area-inset-bottom))",
  },
  gridItem: {
    position: "relative",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    borderRadius: 14,
    border: "2px solid transparent",
    background: "#f4f4f5",
    padding: 0,
  },
  gridItemActive: {
    borderColor: "#111111",
  },
  gridThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  gridLabel: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 999,
    padding: "4px 7px",
    background: "rgba(0,0,0,0.62)",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusPage: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    background: "#f4f4f5",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  statusCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    background: "#ffffff",
    padding: "28px 20px",
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
  },
  statusLogo: {
    width: 190,
    maxWidth: "80%",
    height: "auto",
    marginBottom: 18,
  },
  statusTitle: {
    margin: 0,
    color: "#111111",
    fontSize: 21,
    fontWeight: 900,
  },
  statusDetail: {
    margin: "10px 0 0",
    color: "#666666",
    fontSize: 14,
    lineHeight: 1.45,
  },
};
