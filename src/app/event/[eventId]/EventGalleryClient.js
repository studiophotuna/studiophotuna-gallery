"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayIcon, QrIcon, ShareIcon } from "../../../components/icons";
import QRCodeModal from "../../../components/QRCodeModal";
import StatusView from "../../../components/StatusView";

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
      </header>

      <section style={styles.gridScroll}>
        <div style={styles.grid}>
          {tiles.map((tile, index) => (
            <Link
              key={tile.slug}
              href={`/gallery/${tile.slug}`}
              style={{
                ...styles.tile,
                ...(index === 0 ? styles.heroTile : styles.normalTile),
              }}
            >
              {tile.thumbnail.type === "video" ? (
                <video
                  src={tile.thumbnail.url}
                  muted
                  playsInline
                  preload="metadata"
                  style={styles.tileMedia}
                />
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
    minHeight: "100dvh",
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
    padding:
      "max(18px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 12px max(20px, env(safe-area-inset-left))",
  },
  headerText: {
    minWidth: 0,
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
  headerActions: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
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
  gridScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 3,
    padding: 3,
  },
  tile: {
    position: "relative",
    overflow: "hidden",
    background: "#f4f4f5",
    border: "none",
    padding: 0,
    display: "block",
  },
  heroTile: {
    gridColumn: "1 / -1",
    aspectRatio: "4 / 3",
  },
  normalTile: {
    aspectRatio: "1 / 1",
  },
  tileMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
};
