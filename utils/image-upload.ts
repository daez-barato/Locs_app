import { supabase } from "@/lib/supabase";

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
 * Uploads a picked image and returns its storage path.
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
  const response = await fetch(uri);

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
