"use client";

import { useEffect, useRef } from "react";

export default function VideoThumbnail({ src, style }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    function seekToFirstFrame() {
      if (video.currentTime > 0) return;
      try {
        video.currentTime = 0.1;
      } catch {
        // Not seekable yet; a later readyState change will retry via the listener below.
      }
    }

    if (video.readyState >= 1) {
      seekToFirstFrame();
    }

    video.addEventListener("loadedmetadata", seekToFirstFrame);
    video.addEventListener("loadeddata", seekToFirstFrame);
    return () => {
      video.removeEventListener("loadedmetadata", seekToFirstFrame);
      video.removeEventListener("loadeddata", seekToFirstFrame);
    };
  }, [src]);

  return <video ref={videoRef} src={src} muted playsInline preload="metadata" style={style} />;
}
