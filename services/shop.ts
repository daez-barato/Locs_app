import { supabase } from "@/lib/supabase";
import { AvatarInfo, RARITIES, Rarity, ShopItem } from "@/types/interfaces";
import { ShopItemRow } from "@/types/rpc";
import { resolveAvatarUrl } from "@/utils/avatar";

// All three functions return result objects, like changePrivacy:
//   { error: false, ...payload } | { error: true, msg }
// They never throw. `msg` is already user-facing text, safe to show in an Alert.

export type ShopResult<T> = ({ error: false } & T) | { error: true; msg: string };

export const GENERIC_SHOP_ERROR = "Something went wrong. Please try again.";

// The exact messages raised by the shop RPCs (see locs_server migration), mapped
// to what a user should read. Anything else falls back to GENERIC_SHOP_ERROR so
// raw Postgres/network text never reaches the screen.
const FRIENDLY_ERRORS: Record<string, string> = {
  "not authenticated": "Your session has expired. Please sign in again.",
  "item not found": "This item is no longer available.",
  "item already owned": "You already own this item.",
  "insufficient coins": "You don't have enough coins for this.",
  "item not owned": "You need to buy this item before you can equip it.",
};

export function friendlyShopError(message?: string | null): string {
  const normalized = (message ?? "").trim().toLowerCase();
  if (!normalized) return GENERIC_SHOP_ERROR;
  if (FRIENDLY_ERRORS[normalized]) return FRIENDLY_ERRORS[normalized];
  // Tolerate a prefix/suffix (e.g. a wrapped error) around the known message.
  const key = Object.keys(FRIENDLY_ERRORS).find((k) => normalized.includes(k));
  return key ? FRIENDLY_ERRORS[key] : GENERIC_SHOP_ERROR;
}

// Anything unexpected (a tier added server-side before the app knows it) shows
// as the lowest tier rather than breaking the card.
export function toRarity(value: string | null | undefined): Rarity {
  return (RARITIES as readonly string[]).includes(value ?? "") ? (value as Rarity) : "grey";
}

// get_shop_items returns item_id / image_path; the screen wants id / imagePath
// plus a displayable URL.
export function shopRowToItem(row: ShopItemRow): ShopItem {
  return {
    id: row.item_id,
    kind: row.kind,
    name: row.name,
    price: row.price,
    imagePath: row.image_path,
    imageUrl: resolveAvatarUrl(row.image_path),
    owned: !!row.owned,
    equipped: !!row.equipped,
    rarity: toRarity(row.rarity),
    description: row.description ?? "",
  };
}

/** The catalogue entry for an avatar image path (null means the default). */
export const getAvatarItem = async (imagePath: string | null): Promise<ShopResult<{ item: AvatarInfo | null }>> => {
  try {
    const { data, error } = await supabase.rpc("get_avatar_item", { _image_path: imagePath as string });
    if (error) throw new Error(error.message);
    const row = data?.[0];
    return {
      error: false as const,
      item: row
        ? {
            id: row.item_id,
            name: row.name,
            rarity: toRarity(row.rarity),
            description: row.description ?? "",
            price: row.price,
            active: row.active,
          }
        : null,
    };
  } catch (err: any) {
    console.error("Error fetching avatar item:", err);
    return { error: true as const, msg: friendlyShopError(err?.message) };
  }
};

export const getShopItems = async (): Promise<ShopResult<{ items: ShopItem[] }>> => {
  try {
    const { data, error } = await supabase.rpc("get_shop_items");
    if (error) throw new Error(error.message);

    return { error: false as const, items: (data ?? []).map(shopRowToItem) };
  } catch (err: any) {
    console.error("Error fetching shop items:", err);
    return { error: true as const, msg: friendlyShopError(err?.message) };
  }
};

/** On success, `coins` is the balance after the purchase. */
export const purchaseItem = async (itemId: string): Promise<ShopResult<{ coins: number }>> => {
  try {
    const { data, error } = await supabase.rpc("purchase_item", { _item_id: itemId });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("empty purchase result");

    return { error: false as const, coins: data[0].coins };
  } catch (err: any) {
    console.error("Error purchasing item:", err);
    return { error: true as const, msg: friendlyShopError(err?.message) };
  }
};

/** On success, `avatarPath` is the new users.avatar_url — a storage path, not a URL. */
export const equipItem = async (itemId: string): Promise<ShopResult<{ avatarPath: string }>> => {
  try {
    const { data, error } = await supabase.rpc("equip_item", { _item_id: itemId });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("empty equip result");

    return { error: false as const, avatarPath: data[0].avatar_url };
  } catch (err: any) {
    console.error("Error equipping item:", err);
    return { error: true as const, msg: friendlyShopError(err?.message) };
  }
};
