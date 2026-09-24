/**
 * The shop service's contract with the purchase/equip RPCs: row -> ShopItem
 * mapping (item_id/image_path -> id/imagePath plus a displayable URL), the
 * `_item_id` parameter name, and translating the RPCs' exact error messages into
 * text a user can read.
 */
jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from "@/lib/supabase";
import {
  equipItem,
  getAvatarItem,
  friendlyShopError,
  getShopItems,
  GENERIC_SHOP_ERROR,
  purchaseItem,
} from "@/services/shop";

const mockRpc = supabase.rpc as unknown as jest.Mock;
const mockFrom = supabase.storage.from as unknown as jest.Mock;

const row = {
  item_id: "cool_man",
  kind: "avatar",
  name: "Cool Man",
  price: 25,
  image_path: "Cool_Man.jpeg",
  owned: false,
  equipped: false,
  rarity: "bronze",
  description: "Sunglasses at night games.",
};

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset().mockReturnValue({
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/avatar/${path}` } }),
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("getShopItems", () => {
  it("calls get_shop_items with no arguments", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await getShopItems();

    expect(mockRpc).toHaveBeenCalledWith("get_shop_items");
  });

  it("maps rows to ShopItem view models", async () => {
    mockRpc.mockResolvedValue({
      data: [row, { ...row, item_id: "default_avatar", name: "Default", price: 0,
        image_path: "default_avatar.png", owned: true, equipped: true, rarity: "grey",
        description: "Every legend starts here." }],
      error: null,
    });

    const result = await getShopItems();

    expect(result.error).toBe(false);
    if (result.error) return;
    expect(result.items).toEqual([
      {
        id: "cool_man",
        kind: "avatar",
        name: "Cool Man",
        price: 25,
        imagePath: "Cool_Man.jpeg",
        imageUrl: "https://cdn.test/avatar/Cool_Man.jpeg",
        owned: false,
        equipped: false,
        rarity: "bronze",
        description: "Sunglasses at night games.",
      },
      {
        id: "default_avatar",
        kind: "avatar",
        name: "Default",
        price: 0,
        imagePath: "default_avatar.png",
        imageUrl: "https://cdn.test/avatar/default_avatar.png",
        owned: true,
        equipped: true,
        rarity: "grey",
        description: "Every legend starts here.",
      },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("avatar");
  });

  it("shows an unknown rarity as the lowest tier instead of failing", async () => {
    mockRpc.mockResolvedValue({ data: [{ ...row, rarity: "mythic" }], error: null });

    const result = await getShopItems();

    expect(result.error).toBe(false);
    if (result.error) return;
    expect(result.items[0].rarity).toBe("grey");
  });

  it("returns an error result instead of throwing", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "not authenticated" } });

    const result = await getShopItems();

    expect(result).toEqual({
      error: true,
      msg: "Your session has expired. Please sign in again.",
    });
  });
});

describe("purchaseItem", () => {
  it("calls purchase_item with _item_id, the parameter it declares", async () => {
    mockRpc.mockResolvedValue({ data: [{ item_id: "cool_man", coins: 75 }], error: null });

    await purchaseItem("cool_man");

    expect(mockRpc).toHaveBeenCalledWith("purchase_item", { _item_id: "cool_man" });
  });

  it("returns the balance after purchase", async () => {
    mockRpc.mockResolvedValue({ data: [{ item_id: "cool_man", coins: 75 }], error: null });

    expect(await purchaseItem("cool_man")).toEqual({ error: false, coins: 75 });
  });

  it("maps insufficient coins to friendly text", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "insufficient coins" } });

    expect(await purchaseItem("disco_man")).toEqual({
      error: true,
      msg: "You don't have enough coins for this.",
    });
  });

  it("treats an empty result as a failure", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    expect(await purchaseItem("cool_man")).toEqual({ error: true, msg: GENERIC_SHOP_ERROR });
  });

  it("survives a rejected request", async () => {
    mockRpc.mockRejectedValue(new TypeError("Network request failed"));

    expect(await purchaseItem("cool_man")).toEqual({ error: true, msg: GENERIC_SHOP_ERROR });
  });
});

describe("equipItem", () => {
  it("calls equip_item with _item_id and returns the new avatar path", async () => {
    mockRpc.mockResolvedValue({ data: [{ avatar_url: "Cool_Man.jpeg" }], error: null });

    const result = await equipItem("cool_man");

    expect(mockRpc).toHaveBeenCalledWith("equip_item", { _item_id: "cool_man" });
    expect(result).toEqual({ error: false, avatarPath: "Cool_Man.jpeg" });
  });

  it("maps item not owned to friendly text", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "item not owned" } });

    expect(await equipItem("disco_man")).toEqual({
      error: true,
      msg: "You need to buy this item before you can equip it.",
    });
  });
});

describe("friendlyShopError", () => {
  it.each([
    ["not authenticated", "Your session has expired. Please sign in again."],
    ["item not found", "This item is no longer available."],
    ["item already owned", "You already own this item."],
    ["insufficient coins", "You don't have enough coins for this."],
    ["item not owned", "You need to buy this item before you can equip it."],
  ])("maps %p", (raw, friendly) => {
    expect(friendlyShopError(raw)).toBe(friendly);
  });

  it("does not confuse 'item not owned' with 'item already owned'", () => {
    expect(friendlyShopError("item already owned")).not.toBe(friendlyShopError("item not owned"));
  });

  it.each([undefined, null, "", "duplicate key value violates unique constraint"])(
    "falls back to a generic message for %p",
    (raw) => {
      expect(friendlyShopError(raw as any)).toBe(GENERIC_SHOP_ERROR);
    }
  );
});

describe("getAvatarItem", () => {
  it("maps the catalogue entry behind an avatar", async () => {
    mockRpc.mockResolvedValue({
      data: [{ item_id: "bet_turtle", name: "Bet Turtle", rarity: "gold",
        description: "Slow and steady.", price: 1000, active: false }],
      error: null,
    });

    const result = await getAvatarItem("Bet_Turtle.jpg");

    expect(mockRpc).toHaveBeenCalledWith("get_avatar_item", { _image_path: "Bet_Turtle.jpg" });
    expect(result).toEqual({
      error: false,
      item: { id: "bet_turtle", name: "Bet Turtle", rarity: "gold",
        description: "Slow and steady.", price: 1000, active: false },
    });
  });

  it("returns null for an image that is not in the catalogue", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    expect(await getAvatarItem("custom.png")).toEqual({ error: false, item: null });
  });
});
