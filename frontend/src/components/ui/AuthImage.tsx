"use client";

import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Renders a note image served from the authenticated `/notes/images/:id`
 * endpoint. The browser can't attach the bearer token to a plain <img src>,
 * so we fetch the bytes as a blob and show an object URL.
 */
export function AuthImage({
  imageId,
  alt = "Note image",
  className,
  onClick,
}: {
  imageId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    setFailed(false);
    apiBlob(`/notes/images/${imageId}`)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (failed) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-surface-muted text-xl text-muted",
          className,
        )}
      >
        🖼️
      </div>
    );
  }

  if (!url) {
    return <div className={cn("animate-pulse bg-surface-muted", className)} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, not a remote asset */}
      <img
        src={url}
        alt={alt}
        onClick={onClick}
        className={cn("object-cover", onClick && "cursor-zoom-in", className)}
      />
    </>
  );
}
