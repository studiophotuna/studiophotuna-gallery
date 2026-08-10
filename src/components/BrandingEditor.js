"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";

export default function BrandingEditor({ eventId, gallerySlug = null }) {
  const [status, setStatus] = useState("loading"); // "loading" | "authed" | "unauthed"
  const [branding, setBranding] = useState({ bg_color: "#ffffff", accent_color: "#111111", text_color: "#111111", secondary_text_color: "#71717a" });
  const [eventName, setEventName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const userId = useRef(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          userId.current = session.user.id;
          setStatus("authed");
          await loadBranding(supabase, eventId);
        } else if (event === "INITIAL_SESSION" && !session) {
          const hash = typeof window !== "undefined" ? window.location.hash : "";
          if (!hash.includes("access_token")) {
            setStatus("unauthed");
          }
          // If hash contains access_token, Supabase is still processing — stay in "loading"
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [eventId]);

  async function loadBranding(supabase, evId) {
    const { data } = await supabase
      .from("gallery_event_branding")
      .select("accent_color, bg_color, text_color, secondary_text_color, event_name")
      .eq("event_id", evId)
      .maybeSingle();

    if (data) {
      setBranding({
        bg_color: data.bg_color || "#ffffff",
        accent_color: data.accent_color || "#111111",
        text_color: data.text_color || "#111111",
        secondary_text_color: data.secondary_text_color || "#71717a",
      });
      if (data.event_name) setEventName(data.event_name);
    }

    if (!data?.event_name) {
      try {
        const { data: name } = await supabase.rpc("get_public_event_name", {
          p_event_id: evId,
        });
        if (name) setEventName(name);
      } catch {}
    }
  }

  async function saveBranding() {
    setSaving(true);
    setError("");
    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        setError("Session expired. Please use the link from Studio Photuna again.");
        return;
      }

      const { error: upsertError } = await supabase
        .from("gallery_event_branding")
        .upsert(
          {
            event_id: eventId,
            owner_user_id: data.session.user.id,
            accent_color: branding.accent_color || null,
            bg_color: branding.bg_color || null,
            text_color: branding.text_color || null,
            secondary_text_color: branding.secondary_text_color || null,
            event_name: eventName || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id" }
        );

      if (upsertError) {
        setError(upsertError.message || "Failed to save. Please try again.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error("saveBranding error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Verifying access…</p>
      </div>
    );
  }

  if (status === "unauthed") {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.errorCard}>
          <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: "0 auto 16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div style={styles.errorTitle}>Access required</div>
          <div style={styles.errorDesc}>
            Open the Gallery Branding link from Studio Photuna to access this page.
          </div>
        </div>
      </div>
    );
  }

  const previewBg = branding.bg_color || "#ffffff";
  const previewAccent = branding.accent_color || "#111111";
  const previewText = branding.text_color || "#111111";
  const previewSecondary = branding.secondary_text_color || "#71717a";

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Gallery Branding</div>
            <h1 style={styles.title}>{eventName || eventId}</h1>
          </div>
          <a
            href={gallerySlug ? `/gallery/${gallerySlug}` : `/event/${eventId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.viewLink}
          >
            View Gallery ↗
          </a>
        </header>

        {/* Color pickers */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Colors</div>
          <div style={styles.colorGrid}>
            <ColorField
              label="Background Color"
              value={branding.bg_color || "#ffffff"}
              onChange={(v) => setBranding((p) => ({ ...p, bg_color: v }))}
            />
            <ColorField
              label="Button / Accent Color"
              value={branding.accent_color || "#111111"}
              onChange={(v) => setBranding((p) => ({ ...p, accent_color: v }))}
            />
            <ColorField
              label="Primary Text Color"
              value={branding.text_color || "#111111"}
              onChange={(v) => setBranding((p) => ({ ...p, text_color: v }))}
            />
            <ColorField
              label="Secondary Text Color"
              value={branding.secondary_text_color || "#71717a"}
              onChange={(v) => setBranding((p) => ({ ...p, secondary_text_color: v }))}
            />
          </div>
        </div>

        {/* Live preview */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Preview</div>
          <div style={{ ...styles.preview, background: previewBg }}>
            <div style={styles.previewHeader}>
              <div>
                <div style={{ ...styles.previewTitle, color: previewText }}>{eventName || "Event Gallery"}</div>
                <div style={{ ...styles.previewSubtitle, color: previewSecondary }}>12 Items</div>
              </div>
            </div>
            <div style={styles.previewGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={styles.previewTile} />
              ))}
            </div>
            <div style={styles.previewBottom}>
              <div style={{ ...styles.previewBtn, background: previewAccent, color: contrastFor(previewAccent) }}>
                Download All
              </div>
            </div>
          </div>
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button
          type="button"
          onClick={saveBranding}
          disabled={saving}
          style={{
            ...styles.saveBtn,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save Branding"}
        </button>
        <p style={styles.hint}>
          Branding applies immediately to all galleries for this event.
        </p>
      </div>
    </div>
  );
}

function contrastFor(hex) {
  const c = (hex || "#111111").replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#111111" : "#ffffff";
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <div style={styles.colorLabel}>{label}</div>
      <div style={styles.colorRow}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorSwatch}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          style={styles.colorText}
        />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#111111",
  },
  container: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "48px 20px 80px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#111111",
    lineHeight: 1.2,
  },
  viewLink: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#3b82f6",
    textDecoration: "none",
    paddingTop: 22,
  },
  card: {
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "20px 24px",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 16,
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8,
  },
  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: "2px",
    cursor: "pointer",
    background: "none",
  },
  colorText: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: "0 12px",
    fontSize: 13,
    fontFamily: "monospace",
    color: "#111111",
    background: "#ffffff",
  },
  preview: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "16px 16px 8px",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111111",
  },
  previewSubtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    padding: "4px 8px 8px",
  },
  previewTile: {
    height: 60,
    borderRadius: 6,
    background: "rgba(0,0,0,0.06)",
  },
  previewBottom: {
    padding: "8px 16px 16px",
  },
  previewBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 40,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 800,
  },
  errorMsg: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#dc2626",
    textAlign: "center",
  },
  saveBtn: {
    display: "block",
    width: "100%",
    height: 52,
    borderRadius: 999,
    border: "none",
    background: "#111111",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 10,
    transition: "opacity 0.15s",
  },
  hint: {
    margin: 0,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  fullCenter: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, Helvetica, sans-serif",
    background: "#f8fafc",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111111",
    animation: "spin 0.7s linear infinite",
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 14,
    color: "#9ca3af",
    margin: 0,
  },
  errorCard: {
    textAlign: "center",
    maxWidth: 300,
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111111",
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: "#71717a",
    lineHeight: 1.5,
  },
};
