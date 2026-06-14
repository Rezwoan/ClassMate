/**
 * Client-side image downscale + recompress before upload, so phone photos of
 * hand-written notes don't bloat the SQLite database. Falls back to the
 * original file if the browser can't decode it (e.g. some HEIC on non-Safari).
 */

const MAX_DIMENSION = 1600; // longest edge, px
const JPEG_QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  /** Suggested filename with an extension matching the output type. */
  filename: string;
}

export async function compressImage(file: File): Promise<PreparedImage> {
  // Anything that isn't a raster image we can decode → send as-is.
  if (!file.type.startsWith("image/")) {
    return { blob: file, filename: file.name || "upload" };
  }

  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error("toBlob failed");

    // Only keep the recompressed version if it actually helped.
    if (blob.size < file.size || file.type !== "image/jpeg") {
      return { blob, filename: baseName(file.name) + ".jpg" };
    }
    return { blob: file, filename: file.name };
  } catch {
    return { blob: file, filename: file.name || "upload" };
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decode */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name || "image";
}
