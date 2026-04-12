"use client";

import type { CloudinaryImage } from "@/types";
import { useItemStates } from "@/hooks/useItemStates";
import { formatDate, cloudinaryFilename } from "@/lib/utils";
import { SkeletonPulse } from "./SkeletonPulse";

interface ImageGalleryProps {
  images: CloudinaryImage[];
  loading: boolean;
  onDelete?: (publicId: string) => Promise<void>;
}

interface CardState {
  copied: boolean;
  confirming: boolean;
  deleting: boolean;
}

const DEFAULT_CARD_STATE: CardState = { copied: false, confirming: false, deleting: false };

export function ImageGallery({ images, loading, onDelete }: ImageGalleryProps) {
  const { getState, patchState } = useItemStates<CardState>(DEFAULT_CARD_STATE);

  async function handleCopy(secureUrl: string, publicId: string) {
    await navigator.clipboard.writeText(secureUrl);
    patchState(publicId, { copied: true });
    setTimeout(() => patchState(publicId, { copied: false }), 2000);
  }

  async function handleDelete(publicId: string) {
    if (!onDelete) return;
    patchState(publicId, { deleting: true, confirming: false });
    await onDelete(publicId);
    patchState(publicId, { deleting: false });
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonPulse className="aspect-square w-full" />
            <SkeletonPulse className="h-3 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] py-16 text-sm text-[var(--muted)]">
        No images yet. Upload your first image above.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => {
        const state = getState(image.publicId);
        return (
          <div
            key={image.publicId}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
          >
            {/* Thumbnail */}
            <div className="overflow-hidden rounded-lg bg-[var(--background)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.secureUrl}
                alt={cloudinaryFilename(image.publicId)}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-0.5">
              <p className="truncate text-xs font-medium text-[var(--foreground)]">
                {cloudinaryFilename(image.publicId)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {image.width}×{image.height} · {image.format.toUpperCase()}
              </p>
              <p className="text-xs text-[var(--muted)]">{formatDate(image.createdAt)}</p>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleCopy(image.secureUrl, image.publicId)}
                className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background)] transition-colors duration-150"
              >
                {state.copied ? "Copied!" : "Copy URL"}
              </button>

              {onDelete && !state.confirming && !state.deleting && (
                <button
                  type="button"
                  onClick={() => patchState(image.publicId, { confirming: true })}
                  className="w-full rounded-md border border-[var(--error-border)] px-2 py-1.5 text-xs font-medium text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors duration-150"
                >
                  Delete
                </button>
              )}

              {onDelete && state.confirming && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(image.publicId)}
                    className="flex-1 rounded-md bg-[var(--error)] px-2 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity duration-150"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => patchState(image.publicId, { confirming: false })}
                    className="flex-1 rounded-md border border-[var(--border)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background)] transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {onDelete && state.deleting && (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-xs font-medium text-[var(--muted)] disabled:cursor-not-allowed"
                >
                  Deleting…
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
