"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BackIcon, DownloadIcon, PlayIcon, QrIcon, ShareIcon } from "../../../components/icons";
import QRCodeModal from "../../../components/QRCodeModal";
import StatusView from "../../../components/StatusView";
import VideoThumbnail from "../../../components/VideoThumbnail";

const FILTERS = [
  { key: "all", label: "All Photos" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Videos" },
];

export default function GalleryClient({ gallery, sessions = null, eventName = "", initialError = "" }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaVisible, setMediaVisible] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Reset view state when navigating between sessions
  useEffect(() => {
    setFilter("all");
    setActiveIndex(0);
    setDetailOpen(false);
  }, [selectedSession]);

  const isSessionPicker = Array.isArray(sessions) && sessions.length > 0 && !selectedSession;
  const isEmptyEventGallery = Array.isArray(sessions) && sessions.length === 0 && !selectedSession;

  const items = useMemo(() => {
    const finalUrl = selectedSession ? selectedSession.finalUrl : gallery?.final_url;
    const finalVideoUrl = selectedSession ? selectedSession.finalVideoUrl : gallery?.final_video_url;
    const photoUrls = selectedSession
      ? selectedSession.photoUrls
      : Array.isArray(gallery?.photo_urls) ? gallery.photo_urls : [];
    const burstVideoUrls = selectedSession
      ? selectedSession.burstVideoUrls
      : Array.isArray(gallery?.burst_video_urls) ? gallery.burst_video_urls : [];

    const slides = [];

    if (finalUrl) {
      slides.push({
        key: "final",
        url: finalUrl,
        downloadName: "final-output.png",
        type: "image",
        label: "Final",
      });
    }

    if (finalVideoUrl) {
      const isMp4 = /\.mp4($|\?)/i.test(finalVideoUrl);
      slides.push({
        key: "final-video",
        url: finalVideoUrl,
        downloadName: isMp4 ? "final-motion.mp4" : "final-motion.webm",
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

    burstVideoUrls.forEach((url, index) => {
      if (!url) return;
      const isMp4 = /\.mp4($|\?)/i.test(url);
      slides.push({
        key: `burst-video-${index}`,
        url,
        downloadName: isMp4 ? `burst-video-${index + 1}.mp4` : `burst-video-${index + 1}.webm`,
        type: "video",
        label: `Video ${index + 1}`,
      });
    });

    return slides;
  }, [gallery, selectedSession]);

  const filteredItems = useMemo(() => {
    if (filter === "photo") return items.filter((item) => item.type === "image");
    if (filter === "video") return items.filter((item) => item.type === "video");
    return items;
  }, [items, filter]);

  useEffect(() => {
    if (activeIndex > Math.max(filteredItems.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredItems.length]);

  useEffect(() => {
    setMediaVisible(false);
    const timer = setTimeout(() => setMediaVisible(true), 80);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!detailOpen || !filteredItems.length) return;
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Escape") setDetailOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function openDetail(index) {
    setActiveIndex(index);
    setDetailOpen(true);
  }

  function goPrev() {
    if (!filteredItems.length) return;
    setActiveIndex((current) => (current === 0 ? filteredItems.length - 1 : current - 1));
  }

  function goNext() {
    if (!filteredItems.length) return;
    setActiveIndex((current) => (current === filteredItems.length - 1 ? 0 : current + 1));
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

  async function getFileForItem(item) {
    if (!item?.url) return null;

    const response = await fetch(item.url, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Unable to fetch media file.");
    }

    const blob = await response.blob();
    const type = blob.type || (item.type === "video" ? "video/mp4" : "image/png");
    return new File([blob], item.downloadName, { type });
  }

  async function triggerFileDownload(item) {
    const file = await getFileForItem(item);
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function downloadActiveItem() {
    const item = filteredItems[activeIndex];
    if (!item?.url || downloading) return;

    setDownloading(true);
    try {
      await triggerFileDownload(item);
    } catch {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  async function downloadAllItems() {
    if (!filteredItems.length || downloadingAll) return;

    setDownloadingAll(true);
    try {
      for (let index = 0; index < filteredItems.length; index += 1) {
        const item = filteredItems[index];
        try {
          await triggerFileDownload(item);
        } catch {
          window.open(item.url, "_blank", "noopener,noreferrer");
        }
        if (index < filteredItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    } finally {
      setDownloadingAll(false);
    }
  }

  async function shareActiveItem() {
    const item = filteredItems[activeIndex];
    if (!item?.url || sharing) return;

    const shareText = "#studiophotuna #aheadofthemoment";

    setSharing(true);
    try {
      const file = await getFileForItem(item);
      const shareData = {
        title: "Studio Photuna",
        text: shareText,
        files: file ? [file] : [],
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "Studio Photuna",
          text: shareText,
          url: item.url,
        });
        return;
      }
    } catch {
      // Share sheet was cancelled or file sharing is unavailable.
    } finally {
      setSharing(false);
    }

    try {
      await navigator.clipboard.writeText(item.url);
    } catch {
      window.prompt("Copy this link", item.url);
    }
  }

  async function shareGallery(title) {
    if (sharing) return;

    const shareText = "#studiophotuna #aheadofthemoment";
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      // Share sheet was cancelled.
    } finally {
      setSharing(false);
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  }

  if (initialError) {
    return <StatusView title="Unable to load gallery." detail={initialError} />;
  }

  if (!gallery && !sessions) {
    return (
      <StatusView
        title="Gallery not found"
        detail="The link may be invalid or the gallery is not available."
      />
    );
  }

  // Single-session gallery with no photos yet
  if (!sessions && !items.length) {
    return (
      <StatusView
        title="No photos available"
        detail="This gallery does not contain images yet."
      />
    );
  }

  const displayTitle = eventName || "Studio Photuna Gallery";

  let subtitle = "";
  if (isSessionPicker) {
    subtitle = `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`;
  } else if (!isEmptyEventGallery) {
    const sessionLabel = selectedSession ? `Guest Photos ${selectedSession.index}` : "";
    const createdAt = selectedSession?.createdAt ?? gallery?.created_at;
    const displayDate = createdAt
      ? new Date(createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";
    const countLabel =
      filter === "photo"
        ? filteredItems.length === 1 ? "Photo" : "Photos"
        : filter === "video"
        ? filteredItems.length === 1 ? "Video" : "Videos"
        : filteredItems.length === 1 ? "Item" : "Items";
    subtitle = [sessionLabel, displayDate, `${filteredItems.length} ${countLabel}`]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {selectedSession && (
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              style={styles.iconCircleBtn}
              aria-label="Back to sessions"
            >
              <BackIcon />
            </button>
          )}
          <div style={styles.headerText}>
            <h1 style={styles.title}>{displayTitle}</h1>
            {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => shareGallery(displayTitle)}
            disabled={sharing}
            style={styles.iconCircleBtn}
            aria-label="Share gallery"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            style={styles.iconCircleBtn}
            aria-label="Show QR code"
          >
            <QrIcon />
          </button>
        </div>
      </header>

      {!isSessionPicker && !isEmptyEventGallery && (
        <nav style={styles.tabBar} aria-label="Media filter">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              style={{
                ...styles.tabBtn,
                ...(filter === item.key ? styles.tabBtnActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <section style={styles.gridScroll}>
        {isEmptyEventGallery ? (
          <div style={styles.emptyFilter}>No sessions captured yet.</div>
        ) : isSessionPicker ? (
          <div style={styles.sessionList}>
            <p style={styles.sessionPickerHint}>Select your session to view your photos</p>
            <div style={styles.sessionGrid}>
            {sessions.map((session) => {
              const thumbUrl = session.finalUrl || session.photoUrls[0] || null;
              const photoCount = (session.finalUrl ? 1 : 0) + session.photoUrls.length;
              const videoCount = (session.finalVideoUrl ? 1 : 0) + session.burstVideoUrls.length;
              const dateLabel = session.createdAt
                ? new Date(session.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const mediaLabel = [
                photoCount ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "",
                videoCount ? `${videoCount} video${videoCount !== 1 ? "s" : ""}` : "",
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <button
                  key={session.index}
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  style={styles.sessionCard}
                >
                  <div style={styles.sessionThumb}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" style={styles.sessionThumbImg} />
                    ) : (
                      <div style={styles.sessionThumbPlaceholder}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={styles.sessionCardInfo}>
                    <div style={styles.sessionCardTitle}>Guest Photos {session.index}</div>
                    {dateLabel ? <div style={styles.sessionCardMeta}>{dateLabel}</div> : null}
                    {mediaLabel ? <div style={styles.sessionCardCount}>{mediaLabel}</div> : null}
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={styles.emptyFilter}>
            No {filter === "video" ? "videos" : "photos"} yet.
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => openDetail(index)}
                style={styles.tile}
              >
                {item.type === "video" ? (
                  <VideoThumbnail src={item.url} style={styles.tileMedia} />
                ) : (
                  <img src={item.url} alt="" style={styles.tileMedia} />
                )}
                {item.type === "video" && (
                  <span style={styles.playBadge}>
                    <PlayIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {!isSessionPicker && !isEmptyEventGallery && (
        <div style={styles.bottomBar}>
          <button
            type="button"
            onClick={downloadAllItems}
            disabled={downloadingAll || !filteredItems.length}
            style={styles.downloadAllBtn}
          >
            <DownloadIcon />
            <span>{downloadingAll ? "Downloading..." : "Download All"}</span>
          </button>
        </div>
      )}

      {detailOpen && (
        <DetailView
          items={filteredItems}
          activeIndex={activeIndex}
          mediaVisible={mediaVisible}
          downloading={downloading}
          sharing={sharing}
          onClose={() => setDetailOpen(false)}
          onPrev={goPrev}
          onNext={goNext}
          onDownload={downloadActiveItem}
          onShare={shareActiveItem}
          onShowQr={() => setQrOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <QRCodeModal
        open={qrOpen}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={displayTitle}
        subtitle="Scan to open this gallery on your own phone."
        onClose={() => setQrOpen(false)}
      />
    </main>
  );
}

function DetailView({
  items,
  activeIndex,
  mediaVisible,
  downloading,
  sharing,
  onClose,
  onPrev,
  onNext,
  onDownload,
  onShare,
  onShowQr,
  onTouchStart,
  onTouchEnd,
}) {
  const item = items[activeIndex];
  if (!item) return null;

  return (
    <div style={styles.detailOverlay}>
      <header style={styles.detailHeader}>
        <button
          type="button"
          onClick={onClose}
          style={styles.iconCircleBtnLight}
          aria-label="Back to gallery"
        >
          <BackIcon />
        </button>
        <div style={styles.detailCounter}>
          {activeIndex + 1} / {items.length}
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={onShare}
            disabled={sharing}
            style={styles.iconCircleBtnLight}
            aria-label="Share"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={onShowQr}
            style={styles.iconCircleBtnLight}
            aria-label="Show QR code"
          >
            <QrIcon />
          </button>
        </div>
      </header>

      <section style={styles.viewer} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {item.type === "video" ? (
          <video
            key={item.key}
            src={item.url}
            autoPlay
            controls
            muted
            playsInline
            loop
            preload="metadata"
            style={{
              ...styles.media,
              opacity: mediaVisible ? 1 : 0.5,
              transform: mediaVisible ? "scale(1)" : "scale(0.985)",
            }}
          />
        ) : (
          <img
            key={item.key}
            src={item.url}
            alt="Gallery item"
            style={{
              ...styles.media,
              opacity: mediaVisible ? 1 : 0.5,
              transform: mediaVisible ? "scale(1)" : "scale(0.985)",
            }}
          />
        )}
      </section>

      <nav style={styles.detailActionBar} aria-label="Item actions">
        <button type="button" onClick={onPrev} style={styles.iconButton} aria-label="Previous">
          &lsaquo;
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          style={styles.downloadBtn}
        >
          <DownloadIcon />
          <span>{downloading ? "Saving..." : "Download"}</span>
        </button>
        <button type="button" onClick={onNext} style={styles.iconButton} aria-label="Next">
          &rsaquo;
        </button>
      </nav>
    </div>
  );
}

const styles = {
  page: {
    height: "100dvh",
    overflow: "hidden",
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "max(18px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 12px max(20px, env(safe-area-inset-left))",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    flex: 1,
  },
  headerText: {
    minWidth: 0,
  },
  headerActions: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#71717a",
  },
  iconCircleBtn: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    display: "flex",
    gap: 8,
    padding: "0 max(16px, env(safe-area-inset-left)) 14px",
    overflowX: "auto",
  },
  tabBtn: {
    flexShrink: 0,
    height: 38,
    padding: "0 16px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    background: "#111111",
    color: "#ffffff",
  },
  gridScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  grid: {
    columnWidth: "160px",
    columnCount: 2,
    columnGap: 8,
    padding: 8,
  },
  emptyFilter: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#71717a",
    fontSize: 14,
  },
  tile: {
    position: "relative",
    display: "block",
    width: "100%",
    breakInside: "avoid",
    marginBottom: 8,
    overflow: "hidden",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f4f4f5",
    padding: 0,
  },
  tileMedia: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  playBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Session picker
  sessionList: {
    padding: "4px 12px 24px",
  },
  sessionPickerHint: {
    margin: "8px 0 12px",
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
  sessionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  sessionCard: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    textAlign: "left",
    overflow: "hidden",
    cursor: "pointer",
    padding: 0,
  },
  sessionThumb: {
    width: "100%",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    background: "#f4f4f5",
  },
  sessionThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  sessionThumbPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d4d4d8",
  },
  sessionCardInfo: {
    padding: "10px 12px 12px",
  },
  sessionCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111111",
  },
  sessionCardMeta: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 3,
  },
  sessionCardCount: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 2,
  },
  // Bottom bar
  bottomBar: {
    padding:
      "12px max(16px, env(safe-area-inset-right)) calc(14px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
    background: "#ffffff",
    borderTop: "1px solid #f0f0f0",
  },
  downloadAllBtn: {
    width: "100%",
    height: 52,
    borderRadius: 999,
    border: "none",
    background: "#111111",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  // Detail overlay
  detailOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    background: "#050505",
    color: "#ffffff",
    display: "grid",
    gridTemplateRows: "60px minmax(0, 1fr) 82px",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px max(16px, env(safe-area-inset-right)) 8px max(16px, env(safe-area-inset-left))",
    background: "rgba(5,5,5,0.92)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  iconCircleBtnLight: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  detailCounter: {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.82)",
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
  detailActionBar: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
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
    border: "none",
    fontSize: 15,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};
