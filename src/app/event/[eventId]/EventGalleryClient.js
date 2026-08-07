"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayIcon, QrIcon, ShareIcon } from "../../../components/icons";
import QRCodeModal from "../../../components/QRCodeModal";
import StatusView from "../../../components/StatusView";
import VideoThumbnail from "../../../components/VideoThumbnail";

function getSessionThumbnail(session) {
  if (session.final_url) {
    return { url: session.final_url, type: "image" };
  }

  const photoUrls = Array.isArray(session.photo_urls) ? session.photo_urls : [];
  const firstPhoto = photoUrls.find(Boolean);
  if (firstPhoto) {
    return { url: firstPhoto, type: "image" };
  }

  if (session.final_video_url) {
    return { url: session.final_video_url, type: "video" };
  }

  return null;
}

export default function EventGalleryClient({ sessions, eventName = "", initialError = "" }) {
  const [sharing, setSharing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const tiles = useMemo(() => {
    return (Array.isArray(sessions) ? sessions : [])
      .map((session) => {
        const thumbnail = getSessionThumbnail(session);
        if (!thumbnail) return null;
        return { slug: session.slug, createdAt: session.created_at, thumbnail };
      })
      .filter(Boolean);
  }, [sessions]);

  async function sharePage(title) {
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
    return <StatusView title="Unable to load event gallery." detail={initialError} />;
  }

  if (!tiles.length) {
    return (
      <StatusView
        title="No photos yet"
        detail="This event does not have any published photos yet."
      />
    );
  }

  const displayTitle = eventName || "Studio Photuna Gallery";
  const earliestCreatedAt = tiles.reduce((earliest, tile) => {
    if (!tile.createdAt) return earliest;
    return !earliest || tile.createdAt < earliest ? tile.createdAt : earliest;
  }, null);
  const displayDate = earliestCreatedAt
    ? new Date(earliestCreatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const subtitle = [displayDate, `${tiles.length} Session${tiles.length === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerText}>
            <h1 style={styles.title}>{displayTitle}</h1>
            <div style={styles.subtitle}>{subtitle}</div>
          </div>
          <div style={styles.headerActions}>
            <button
              type="button"
              onClick={() => sharePage(displayTitle)}
              disabled={sharing}
              style={styles.iconCircleBtn}
              aria-label="Share event gallery"
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
        </div>
      </header>

      <section style={styles.gridWrap}>
        <div style={styles.grid}>
          {tiles.map((tile) => (
            <Link key={tile.slug} href={`/gallery/${tile.slug}`} style={styles.tile}>
              {tile.thumbnail.type === "video" ? (
                <VideoThumbnail src={tile.thumbnail.url} style={styles.tileMedia} />
              ) : (
                <img src={tile.thumbnail.url} alt="" style={styles.tileMedia} />
              )}
              {tile.thumbnail.type === "video" && (
                <span style={styles.playBadge}>
                  <PlayIcon />
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <QRCodeModal
        open={qrOpen}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={displayTitle}
        subtitle="Scan to find your photo if you missed it at the booth."
        onClose={() => setQrOpen(false)}
      />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111111",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #efefef",
  },
  headerInner: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "22px 32px",
  },
  headerText: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#71717a",
  },
  headerActions: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  iconCircleBtn: {
    flexShrink: 0,
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  gridWrap: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "28px 32px 56px",
  },
  grid: {
    columnWidth: "260px",
    columnCount: 5,
    columnGap: 16,
  },
  tile: {
    position: "relative",
    display: "block",
    breakInside: "avoid",
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f4f4f5",
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
    width: 42,
    height: 42,
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
