import { supabase } from "@/lib/supabase";

/** Public bucket holding the avatar catalogue; users.avatar_url is a path in it. */
export const AVATAR_BUCKET = "avatar";
export const DEFAULT_AVATAR_PATH = "default_avatar.webp";

/**
 * users.avatar_url (and shop_items.image_path) hold an object PATH in the public
 * `avatar` bucket, not a URL — rendering it directly as a uri shows nothing.
 *
 *   null / ""          -> public URL of default_avatar.webp
 *   "http(s)://..."    -> unchanged (legacy rows that already hold a full URL)
 *   anything else      -> public URL of that object
 *
 * Synchronous: getPublicUrl only builds a string, there is no request.
 */
export function resolveAvatarUrl(path?: string | null): string {
  const trimmed = path?.trim();
  if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;

  const objectPath = trimmed ? trimmed : DEFAULT_AVATAR_PATH;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}
