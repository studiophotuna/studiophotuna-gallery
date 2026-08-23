"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeImage({ value, size = 220, fgColor = "#111111", lightColor = "#ffffff" }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value) return undefined;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: fgColor, light: lightColor },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [value, size, fgColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "#f4f4f5",
          borderRadius: 12,
        }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 12 }}
    />
  );
}
