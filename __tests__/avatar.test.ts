/**
 * users.avatar_url holds a storage path in the public `avatar` bucket, not a
 * URL — rendering it directly as a uri showed nothing. resolveAvatarUrl turns
 * whatever is stored into something an <Image> can load.
 */
jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: { from: jest.fn() },
  },
}));

import { supabase } from "@/lib/supabase";
import { resolveAvatarUrl } from "@/utils/avatar";

const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockGetPublicUrl = jest.fn();

beforeEach(() => {
  mockGetPublicUrl.mockReset().mockImplementation((path: string) => ({
    data: { publicUrl: `https://cdn.test/storage/v1/object/public/avatar/${path}` },
  }));
  mockFrom.mockReset().mockReturnValue({ getPublicUrl: mockGetPublicUrl });
});

describe("resolveAvatarUrl", () => {
  it.each([null, undefined, "", "   "])("falls back to the default avatar for %p", (value) => {
    expect(resolveAvatarUrl(value as any)).toBe(
      "https://cdn.test/storage/v1/object/public/avatar/default_avatar.png"
    );
    expect(mockFrom).toHaveBeenCalledWith("avatar");
    expect(mockGetPublicUrl).toHaveBeenCalledWith("default_avatar.png");
  });

  it("passes full http(s) URLs through untouched", () => {
    expect(resolveAvatarUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(resolveAvatarUrl("http://example.com/a.png")).toBe("http://example.com/a.png");
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
  });

  it("resolves a storage path to its public URL in the avatar bucket", () => {
    expect(resolveAvatarUrl("Cool_Man.jpeg")).toBe(
      "https://cdn.test/storage/v1/object/public/avatar/Cool_Man.jpeg"
    );
    expect(mockFrom).toHaveBeenCalledWith("avatar");
    // object names are case-sensitive — the path must reach storage unchanged
    expect(mockGetPublicUrl).toHaveBeenCalledWith("Cool_Man.jpeg");
  });
});
