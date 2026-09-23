/**
 * event-thumbnail is a private bucket, so rows carry an object path that renders
 * as a broken image until it's signed. Signing is batched per page rather than
 * per card.
 */
jest.mock("@/lib/supabase", () => ({
  supabase: { storage: { from: jest.fn() } },
}));

import { supabase } from "@/lib/supabase";
import { signThumbnails } from "@/utils/image-upload";

const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockCreateSignedUrls = jest.fn();

beforeEach(() => {
  mockCreateSignedUrls.mockReset();
  mockFrom.mockReset().mockReturnValue({ createSignedUrls: mockCreateSignedUrls });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("signThumbnails", () => {
  it("replaces storage paths with signed urls", async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [{ path: "u/1.jpg", signedUrl: "https://signed/1" }],
      error: null,
    });

    const rows = await signThumbnails([{ id: "a", thumbnail_url: "u/1.jpg" }]);

    expect(rows[0].thumbnail_url).toBe("https://signed/1");
    expect(rows[0].id).toBe("a");
  });

  it("signs a whole page in one request, not one per row", async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: "u/1.jpg", signedUrl: "https://signed/1" },
        { path: "u/2.jpg", signedUrl: "https://signed/2" },
      ],
      error: null,
    });

    await signThumbnails([
      { thumbnail_url: "u/1.jpg" },
      { thumbnail_url: "u/2.jpg" },
      { thumbnail_url: "u/1.jpg" },
    ]);

    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);
    // duplicates are de-duped before the request
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(["u/1.jpg", "u/2.jpg"], expect.any(Number));
  });

  it("makes no request when nothing needs signing", async () => {
    const rows = await signThumbnails([{ thumbnail_url: null }, {}]);

    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
    expect(rows).toHaveLength(2);
  });

  it("leaves absolute urls untouched", async () => {
    const rows = await signThumbnails([{ thumbnail_url: "https://cdn/x.jpg" }]);

    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
    expect(rows[0].thumbnail_url).toBe("https://cdn/x.jpg");
  });

  it("renders placeholders rather than blanking the list when signing fails", async () => {
    mockCreateSignedUrls.mockResolvedValue({ data: null, error: { message: "nope" } });

    const rows = await signThumbnails([{ id: "a", thumbnail_url: "u/1.jpg" }]);

    expect(rows).toHaveLength(1);
    expect(rows[0].thumbnail_url).toBeNull();
    expect(rows[0].id).toBe("a");
  });

  it("nulls a path the server declined to sign", async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [{ path: "u/1.jpg", signedUrl: null }],
      error: null,
    });

    const rows = await signThumbnails([{ thumbnail_url: "u/1.jpg" }]);
    expect(rows[0].thumbnail_url).toBeNull();
  });
});
