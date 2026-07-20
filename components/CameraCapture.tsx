"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Quality = {
  brightness: number;
  sharpness: number;
  ok: boolean;
  reason?: string;
};

type Props = {
  /** Wird mit dem aufgenommenen Bild (JPEG data-URL) und einer Qualitätsschätzung aufgerufen. */
  onCapture: (dataUrl: string, quality: Quality) => void;
  /** Buttonbeschriftung des Auslösers. */
  shutterLabel?: string;
  disabled?: boolean;
  /** Blendet ein 3x3-Hilfsraster über die Live-Kamera ein (zum Auslegen von Karten). */
  gridOverlay?: boolean;
};

const MAX_DIM = 1600;

function assessQuality(ctx: CanvasRenderingContext2D, w: number, h: number): Quality {
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float64Array(w * h);
  let sumLuma = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = l;
    sumLuma += l;
  }
  const brightness = sumLuma / (w * h);

  // Sehr einfache Schärfe-Schätzung: mittlere quadrierte Gradientenenergie.
  let grad = 0;
  let n = 0;
  for (let y = 1; y < h; y++) {
    for (let x = 1; x < w; x++) {
      const p = y * w + x;
      const dx = gray[p] - gray[p - 1];
      const dy = gray[p] - gray[p - w];
      grad += dx * dx + dy * dy;
      n++;
    }
  }
  const sharpness = n ? grad / n : 0;

  let ok = true;
  let reason: string | undefined;
  if (brightness < 45) {
    ok = false;
    reason = "Zu dunkel – mehr Licht oder näher ran.";
  } else if (sharpness < 45) {
    ok = false;
    reason = "Wirkt unscharf – Kamera ruhig halten und scharfstellen.";
  }
  return { brightness, sharpness, ok, reason };
}

export default function CameraCapture({
  onCapture,
  shutterLabel = "Foto aufnehmen",
  disabled,
  gridOverlay,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setUseFallback(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e: any) {
        setUseFallback(true);
        setError(
          "Kamera nicht verfügbar – du kannst stattdessen ein Foto auswählen."
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shoot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const scale = Math.min(1, MAX_DIM / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const quality = assessQuality(ctx, w, h);
    onCapture(dataUrl, quality);
  }, [onCapture]);

  const onFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          const quality = assessQuality(ctx, w, h);
          onCapture(dataUrl, quality);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  if (useFallback) {
    return (
      <div className="stack">
        {error && <div className="toast warn">{error}</div>}
        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          {shutterLabel}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted />
        {gridOverlay && (
          <div className="grid3x3" aria-hidden>
            <span /><span /><span /><span />
          </div>
        )}
      </div>
      <button
        className="btn btn-primary"
        onClick={shoot}
        disabled={disabled || !ready}
      >
        {ready ? shutterLabel : "Kamera startet …"}
      </button>
    </div>
  );
}
