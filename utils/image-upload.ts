import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

// Thumbnails render at most card width on a phone, so a full-resolution photo
// (often 4000px and several MB) was uploaded only to be scaled down on every
// device that showed it. Everything is shrunk to this width and re-encoded as
// JPEG first, which keeps uploads around 100–200 KB.
const MAX_IMAGE_WIDTH = 1280;
const JPEG_QUALITY = 0.7;

// Keep these in sync with the buckets' own limits in Supabase Storage, so an
// oversized pick fails here with a readable message instead of a raw 413 from
// the server after the user has already waited for the upload.
export const IMAGE_LIMITS = {
  "event-thumbnail": 8 * 1024 * 1024,
  avatar: 5 * 1024 * 1024,
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Turns event-thumbnail storage paths into displayable URLs.
 *
 * The bucket is private, so the raw path stored on a template renders as a
 * broken image. Signs the whole page of results in one request rather than one
 * per card, and leaves already-signed/absolute URLs untouched.
 */
export async function signThumbnails<T extends Record<string, any>>(
  rows: T[]
): Promise<T[]> {
  const paths = Array.from(
    new Set(
      rows
        .map((r) => r.thumbnail_url as string | null | undefined)
        .filter((p): p is string => !!p && !p.startsWith("http"))
    )
  );

  if (paths.length === 0) return rows;

  const { data, error } = await supabase.storage
    .from("event-thumbnail")
    .createSignedUrls(paths, 60 * 60);

  if (error || !data) {
    // A failed signing shouldn't blank out the list — just render placeholders.
    console.error("Error signing thumbnails:", error);
    return rows.map((r) => ({ ...r, thumbnail_url: null }) as T);
  }

  const byPath = new Map(
    data.filter((d) => d.signedUrl).map((d) => [d.path as string, d.signedUrl])
  );

  return rows.map((r) =>
    r.thumbnail_url && !r.thumbnail_url.startsWith("http")
      ? ({ ...r, thumbnail_url: byPath.get(r.thumbnail_url) ?? null } as T)
      : r
  );
}

type Bucket = keyof typeof IMAGE_LIMITS;

/**
 * Downscales a picked image to MAX_IMAGE_WIDTH (never upscales) and re-encodes
 * it as JPEG, returning the URI of the smaller file. Falls back to the original
 * URI if the image can't be processed, so a manipulator failure costs size, not
 * the upload.
 */
export async function shrinkImage(uri: string): Promise<string> {
  try {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    const context = ImageManipulator.manipulate(original);
    if (original.width > MAX_IMAGE_WIDTH) {
      context.resize({ width: MAX_IMAGE_WIDTH });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    return saved.uri;
  } catch (error) {
    console.error("Error shrinking image, uploading the original:", error);
    return uri;
  }
}

/**
 * Shrinks and uploads a picked image, returning its storage path.
 *
 * Reads via arrayBuffer rather than blob: React Native's Blob doesn't carry the
 * underlying bytes in a way supabase-js can upload, which silently produces
 * empty objects. arrayBuffer also gives an exact byte length to check first.
 */
export async function uploadImage(
  bucket: Bucket,
  uri: string,
  userId: string,
  fileName?: string
): Promise<string> {
  const response = await fetch(await shrinkImage(uri));

  if (!response.ok) {
    throw new Error("Could not read the selected image.");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const type = ALLOWED_TYPES.includes(contentType as any) ? contentType : "image/jpeg";

  const arrayBuffer = await response.arrayBuffer();
  const limit = IMAGE_LIMITS[bucket];

  if (arrayBuffer.byteLength === 0) {
    throw new Error("The selected image appears to be empty.");
  }

  if (arrayBuffer.byteLength > limit) {
    throw new Error(
      `That image is ${formatMb(arrayBuffer.byteLength)}. Please choose one under ${formatMb(limit)}.`
    );
  }

  const ext = EXT_BY_TYPE[type] || "jpg";
  const path = `${userId}/${fileName ?? Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: type, upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
