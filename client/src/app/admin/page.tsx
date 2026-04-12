"use client";

import { useEffect, useState, useCallback } from "react";
import type { CloudinaryImage } from "@/types";
import { AdminAuth } from "@/components/ui/AdminAuth";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ImageGallery } from "@/components/ui/ImageGallery";
import api from "@/lib/api";

const SESSION_STORAGE_KEY = "adminToken";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";
// Keep this in sync with config.cloudinary.folder on the server
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  function handleLogout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setToken(null);
    setImages([]);
  }

  const fetchImages = useCallback(
    async (authToken: string) => {
      setLoadingImages(true);
      try {
        const result = await api.admin.listImages(authToken);
        if (result.success && result.data) {
          setImages(result.data);
        } else if (result.error?.toLowerCase().includes("unauthorized")) {
          handleLogout();
        }
      } finally {
        setLoadingImages(false);
      }
    },
    []
  );

  // Restore token from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      setToken(stored);
      void fetchImages(stored);
    }
  }, [fetchImages]);

  function handleAuthenticated(newToken: string) {
    setToken(newToken);
    void fetchImages(newToken);
  }

  async function handleDeleteImage(publicId: string) {
    if (!token) return;
    const result = await api.admin.deleteImage(token, publicId);
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } else if (result.error?.toLowerCase().includes("unauthorized")) {
      handleLogout();
    }
  }

  if (!token) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Image Manager</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            Log out
          </button>
        </div>

        {/* Uploader */}
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="flex-1 text-sm text-[var(--muted)]">
            Upload new images to your Cloudinary library.
          </p>
          <ImageUploader
            cloudName={CLOUDINARY_CLOUD_NAME}
            uploadPreset={CLOUDINARY_UPLOAD_PRESET}
            folder={CLOUDINARY_FOLDER}
            onUploadComplete={() => void fetchImages(token)}
          />
        </div>

        {/* Gallery */}
        <ImageGallery
          images={images}
          loading={loadingImages}
          onDelete={handleDeleteImage}
        />
      </div>
    </main>
  );
}
