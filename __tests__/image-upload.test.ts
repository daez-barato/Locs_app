/**
 * Upload guards. The size limit exists because the storage bucket rejects
 * oversized files with a raw 413 after the user has already waited for the
 * upload, and the ArrayBuffer read exists because React Native's Blob doesn't
 * carry bytes supabase-js can upload — that silently produced empty objects.
 */
// The factory is hoisted above the imports, so it must not close over anything
// declared below it — build the mock inline and wire behaviour in beforeEach.
jest.mock("@/lib/supabase", () => ({
  supabase: { storage: { from: jest.fn() } },
}));

import { supabase } from "@/lib/supabase";
import { uploadImage, IMAGE_LIMITS } from "@/utils/image-upload";

const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockUpload = jest.fn();

function mockFetch(bytes: number, contentType = "image/jpeg", ok = true) {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok,
    headers: { get: () => contentType },
    arrayBuffer: async () => new ArrayBuffer(bytes),
  });
}

beforeEach(() => {
  mockUpload.mockReset().mockResolvedValue({ error: null });
  mockFrom.mockReset().mockReturnValue({ upload: mockUpload });
});

describe("uploadImage", () => {
  it("uploads a normal image and returns its storage path", async () => {
    mockFetch(1024);
    const path = await uploadImage("event-thumbnail", "file:///pic.jpg", "user-1");

    expect(path).toMatch(/^user-1\/\d+\.jpg$/);
    expect(mockFrom).toHaveBeenCalledWith("event-thumbnail");
    expect(mockUpload).toHaveBeenCalledWith(
      path,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: "image/jpeg" })
    );
  });

  it("uploads under the caller's own folder, which the storage policy requires", async () => {
    mockFetch(1024);
    const path = await uploadImage("avatar", "file:///a.png", "user-42", "avatar");
    expect(path.startsWith("user-42/")).toBe(true);
  });

  it("rejects an image over the bucket limit before uploading", async () => {
    mockFetch(IMAGE_LIMITS["event-thumbnail"] + 1);

    await expect(
      uploadImage("event-thumbnail", "file:///huge.jpg", "user-1")
    ).rejects.toThrow(/8\.0 MB/);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("applies the smaller avatar limit to avatars", async () => {
    mockFetch(IMAGE_LIMITS.avatar + 1);

    await expect(uploadImage("avatar", "file:///huge.jpg", "u")).rejects.toThrow(/5\.0 MB/);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rejects an empty read rather than creating a 0-byte object", async () => {
    mockFetch(0);

    await expect(
      uploadImage("event-thumbnail", "file:///empty.jpg", "user-1")
    ).rejects.toThrow(/empty/i);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("keeps the real extension for png and webp", async () => {
    mockFetch(1024, "image/png");
    expect(await uploadImage("avatar", "file:///a.png", "u")).toMatch(/\.png$/);

    mockFetch(1024, "image/webp");
    expect(await uploadImage("avatar", "file:///a.webp", "u")).toMatch(/\.webp$/);
  });

  it("falls back to jpeg for an unsupported content type", async () => {
    mockFetch(1024, "image/gif");
    const path = await uploadImage("avatar", "file:///a.gif", "u");

    expect(path).toMatch(/\.jpg$/);
    expect(mockUpload).toHaveBeenCalledWith(
      path,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: "image/jpeg" })
    );
  });

  it("surfaces a storage failure", async () => {
    mockFetch(1024);
    mockUpload.mockResolvedValue({ error: { message: "mime type not allowed" } });

    await expect(uploadImage("avatar", "file:///a.jpg", "u")).rejects.toThrow(
      "mime type not allowed"
    );
  });

  it("reports an unreadable file instead of uploading nothing", async () => {
    mockFetch(0, "image/jpeg", false);

    await expect(uploadImage("avatar", "file:///gone.jpg", "u")).rejects.toThrow(
      /could not read/i
    );
  });
});
