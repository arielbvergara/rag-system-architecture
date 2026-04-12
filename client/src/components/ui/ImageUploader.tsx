"use client";

import { useEffect, useRef, useState } from "react";

const CLOUDINARY_WIDGET_URL =
  "https://upload-widget.cloudinary.com/latest/global/all.js";

interface CloudinaryWidget {
  open: () => void;
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event: string }) => void
      ) => CloudinaryWidget;
    };
  }
}

interface ImageUploaderProps {
  cloudName: string;
  uploadPreset: string;
  folder: string;
  onUploadComplete: () => void;
}

export function ImageUploader({
  cloudName,
  uploadPreset,
  folder,
  onUploadComplete,
}: ImageUploaderProps) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const widgetRef = useRef<CloudinaryWidget | null>(null);

  useEffect(() => {
    const existingScript = document.querySelector(
      `script[src="${CLOUDINARY_WIDGET_URL}"]`
    );

    if (existingScript) {
      queueMicrotask(() => setIsScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = CLOUDINARY_WIDGET_URL;
    script.async = true;
    script.onload = () => setIsScriptReady(true);
    document.body.appendChild(script);
  }, []);

  function handleOpenWidget() {
    if (!isScriptReady) return;

    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder,
          allowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
          styles: {
            palette: {
              action: "#6366F1",
              link: "#6366F1",
            },
          },
        },
        (_error, result) => {
          if (result?.event === "success") {
            onUploadComplete();
          }
        }
      );
    }

    widgetRef.current.open();
  }

  return (
    <button
      type="button"
      onClick={handleOpenWidget}
      disabled={!isScriptReady}
      className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150"
    >
      {isScriptReady ? "Upload Images" : "Loading…"}
    </button>
  );
}
