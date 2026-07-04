"use client";

import QRCodeImage from "./QRCodeImage";

export default function QRCodeModal({ open, url, title, subtitle, onClose }) {
  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
          &times;
        </button>
        <QRCodeImage value={url} size={220} />
        {title && <p style={styles.title}>{title}</p>}
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "rgba(0,0,0,0.58)",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 320,
    borderRadius: 22,
    background: "#ffffff",
    padding: "28px 24px 26px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111111",
    fontSize: 20,
    lineHeight: 1,
  },
  title: {
    margin: "18px 0 0",
    color: "#111111",
    fontSize: 17,
    fontWeight: 800,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#71717a",
    fontSize: 13,
    lineHeight: 1.4,
  },
};
