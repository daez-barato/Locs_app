import { ImageManipulator, ImageRef, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

// Keep these in sync with the buckets' own limits in Supabase Storage. Event
// covers only accept WebP up to 1 MiB: a cover renders at most screen width,
// and a 1280px WebP photo is a few hundred KB, so the limit is headroom rather
// than a squeeze.
export const IMAGE_LIMITS = {
  "event-thumbnail": 1024 * 1024,
  avatar: 5 * 1024 * 1024,
} as const;

// Tried in order until one fits the bucket's limit; nearly every photo fits
// the first. Widths are a ceiling, never an upscale.
const WEBP_ENCODE_ATTEMPTS = [
  { width: 1280, quality: 0.75 },
  { width: 1280, quality: 0.55 },
  { width: 960, quality: 0.5 },
] as const;

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
 * Re-encodes a picked image as WebP that fits the bucket's limit, returning the
 * encoded file and its bytes. Throws a readable error when the image can't be
 * processed, or when even the smallest attempt is over the limit — the bucket
 * only takes WebP, so uploading the original instead would fail anyway.
 */
export async function shrinkImage(
  uri: string,
  bucket: Bucket = "event-thumbnail"
): Promise<{ uri: string; bytes: ArrayBuffer }> {
  const unprocessable = (error: unknown) => {
    console.error("Error encoding image:", error);
    return new Error("Couldn't process that image. Try a different photo.");
  };

  let original: ImageRef;
  try {
    original = await ImageManipulator.manipulate(uri).renderAsync();
  } catch (error) {
    throw unprocessable(error);
  }

  for (const attempt of WEBP_ENCODE_ATTEMPTS) {
    let encodedUri: string;
    try {
      const context = ImageManipulator.manipulate(original);
      if (original.width > attempt.width) {
        context.resize({ width: attempt.width });
      }
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ compress: attempt.quality, format: SaveFormat.WEBP });
      encodedUri = saved.uri;
    } catch (error) {
      throw unprocessable(error);
    }

    // Read via arrayBuffer rather than blob: React Native's Blob doesn't carry
    // the bytes in a way supabase-js can upload, which silently produced empty
    // objects. It also gives the exact size to check against the limit.
    const response = await fetch(encodedUri);
    if (!response.ok) {
      throw new Error("Could not read the selected image.");
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength <= IMAGE_LIMITS[bucket]) {
      return { uri: encodedUri, bytes };
    }
  }

  throw new Error("That image is too large to upload, even compressed. Try a different photo.");
}

/** Encodes and uploads a picked image, returning its storage path. */
export async function uploadImage(
  bucket: Bucket,
  uri: string,
  userId: string,
  fileName?: string
): Promise<string> {
  const { bytes } = await shrinkImage(uri, bucket);

  if (bytes.byteLength === 0) {
    throw new Error("The selected image appears to be empty.");
  }

  const path = `${userId}/${fileName ?? Date.now()}.webp`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: "image/webp", upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
