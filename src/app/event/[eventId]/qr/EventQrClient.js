"use client";

import { useEffect, useState } from "react";
import QRCodeImage from "../../../../components/QRCodeImage";
import StatusView from "../../../../components/StatusView";

export default function EventQrClient({ eventId, eventName = "", initialError = "" }) {
  const [galleryUrl, setGalleryUrl] = useState("");

  useEffect(() => {
    if (eventId) {
      setGalleryUrl(`${window.location.origin}/event/${eventId}`);
    }
  }, [eventId]);

  if (initialError) {
    return <StatusView title="Unable to load QR code." detail={initialError} />;
  }

  const displayTitle = eventName || "Studio Photuna Gallery";

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Scan to find your photo</p>
        <h1 style={styles.title}>{displayTitle}</h1>
        <div style={styles.qrWrap}>
          <QRCodeImage value={galleryUrl} size={320} />
        </div>
        <p style={styles.caption}>Missed the QR code at your session? Scan this to browse every photo from tonight.</p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    background: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.4,
    color: "#71717a",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 28px",
    fontSize: 34,
    fontWeight: 900,
    color: "#111111",
    lineHeight: 1.15,
  },
  qrWrap: {
    display: "flex",
    justifyContent: "center",
    padding: 20,
    borderRadius: 24,
    border: "1px solid #e5e7eb",
  },
  caption: {
    margin: "28px 0 0",
    fontSize: 15,
    color: "#52525b",
    lineHeight: 1.5,
  },
};
