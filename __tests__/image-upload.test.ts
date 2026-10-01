import { supabase } from "@/lib/supabase";
import { uploadImage, shrinkImage, IMAGE_LIMITS } from "@/utils/image-upload";

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

// Stands in for the native module: reports a 4000px wide photo and records the
// resize and save it was asked for.
jest.mock("expo-image-manipulator", () => {
  const resize = jest.fn();
  const saveAsync = jest.fn(async () => ({ uri: "file:///small.webp" }));
  const manipulate = jest.fn(() => ({
    resize,
    renderAsync: async () => ({ width: 4000, height: 2250, saveAsync }),
  }));
  return {
    ImageManipulator: { manipulate },
    SaveFormat: { WEBP: "webp" },
    __mocks: { manipulate, resize, saveAsync },
  };
});

const manipulatorMocks = jest.requireMock("expo-image-manipulator").__mocks;

const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockUpload = jest.fn();

function mockFetch(bytesOrSequence: number | number[], contentType = "image/webp", ok = true) {
  if (Array.isArray(bytesOrSequence)) {
    // Handle multiple calls with different byte sizes (for retry attempts).
    let callCount = 0;
    (global as any).fetch = jest.fn(async () => {
      const bytes = bytesOrSequence[Math.min(callCount, bytesOrSequence.length - 1)];
      callCount++;
      return {
        ok,
        headers: { get: () => contentType },
        arrayBuffer: async () => new ArrayBuffer(bytes),
      };
    });
  } else {
    // Single fixed byte size for all calls.
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok,
      headers: { get: () => contentType },
      arrayBuffer: async () => new ArrayBuffer(bytesOrSequence),
    });
  }
}

beforeEach(() => {
  mockUpload.mockReset().mockResolvedValue({ error: null });
  mockFrom.mockReset().mockReturnValue({ upload: mockUpload });
  manipulatorMocks.saveAsync.mockReset().mockResolvedValue({ uri: "file:///small.webp" });
  manipulatorMocks.resize.mockReset();
  manipulatorMocks.manipulate.mockReset().mockReturnValue({
    resize: manipulatorMocks.resize,
    renderAsync: async () => ({ width: 4000, height: 2250, saveAsync: manipulatorMocks.saveAsync }),
  });
});

describe("uploadImage", () => {
  it("uploads a normal image and returns its storage path", async () => {
    mockFetch(1024);
    const path = await uploadImage("event-thumbnail", "file:///pic.jpg", "user-1");

    expect(path).toMatch(/^user-1\/\d+\.webp$/);
    expect(mockFrom).toHaveBeenCalledWith("event-thumbnail");
    expect(mockUpload).toHaveBeenCalledWith(
      path,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: "image/webp" })
    );
  });

  it("uploads under the caller's own folder, which the storage policy requires", async () => {
    mockFetch(1024);
    const path = await uploadImage("avatar", "file:///a.png", "user-42", "avatar");
    expect(path.startsWith("user-42/")).toBe(true);
    expect(path).toMatch(/\.webp$/);
  });

  it("rejects an event-thumbnail over the limit, throwing from shrinkImage", async () => {
    // All retry attempts return sizes over 1 MiB
    mockFetch([2 * 1024 * 1024, 2 * 1024 * 1024, 2 * 1024 * 1024]);

    await expect(
      uploadImage("event-thumbnail", "file:///huge.jpg", "user-1")
    ).rejects.toThrow(/too large to upload, even compressed/);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("holds avatars to the avatar bucket's own limit", async () => {
    // Over the 1 MiB cover limit but within the avatar one: uploads first try.
    mockFetch(2 * 1024 * 1024);
    await uploadImage("avatar", "file:///a.jpg", "u");
    expect(manipulatorMocks.saveAsync).toHaveBeenCalledTimes(1);

    mockFetch(IMAGE_LIMITS.avatar + 1);
    await expect(uploadImage("avatar", "file:///huge.jpg", "u")).rejects.toThrow(/too large/);
  });

  it("rejects an empty read rather than creating a 0-byte object", async () => {
    mockFetch(0);

    await expect(
      uploadImage("event-thumbnail", "file:///empty.jpg", "user-1")
    ).rejects.toThrow(/empty/i);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("surfaces a storage failure", async () => {
    mockFetch(1024);
    mockUpload.mockResolvedValue({ error: { message: "mime type not allowed" } });

    await expect(uploadImage("avatar", "file:///a.jpg", "u")).rejects.toThrow(
      "mime type not allowed"
    );
  });

  it("reports an unreadable file instead of uploading nothing", async () => {
    mockFetch(0, "image/webp", false);

    await expect(uploadImage("avatar", "file:///gone.jpg", "u")).rejects.toThrow(
      /could not read/i
    );
  });
});

describe("shrinkImage", () => {
  it("scales a large photo down to 1280px wide and encodes it as WebP", async () => {
    mockFetch(400 * 1024); // 400 KB fits in 1 MiB
    const { uri, bytes } = await shrinkImage("file:///huge.jpg");

    expect(uri).toBe("file:///small.webp");
    expect(bytes.byteLength).toBe(400 * 1024);
    expect(manipulatorMocks.resize).toHaveBeenCalledWith({ width: 1280 });
    expect(manipulatorMocks.saveAsync).toHaveBeenCalledWith({ compress: 0.75, format: "webp" });
  });

  it("does not upscale an image narrower than 1280px", async () => {
    mockFetch(200 * 1024);
    manipulatorMocks.manipulate.mockReturnValue({
      resize: manipulatorMocks.resize,
      renderAsync: jest.fn(async () => ({
        width: 800,
        height: 600,
        saveAsync: manipulatorMocks.saveAsync,
      })),
    });

    await shrinkImage("file:///narrow.jpg");

    expect(manipulatorMocks.resize).not.toHaveBeenCalled();
  });

  it("retries with lower quality if the first attempt exceeds the limit", async () => {
    // First fetch (attempt 1): too large; second fetch (attempt 2): fits
    mockFetch([2 * 1024 * 1024, 400 * 1024]);
    const { uri } = await shrinkImage("file:///huge.jpg");

    expect(uri).toBe("file:///small.webp");
    // Should have called saveAsync twice: once for attempt 1, once for attempt 2
    expect(manipulatorMocks.saveAsync).toHaveBeenCalledTimes(2);
    expect(manipulatorMocks.saveAsync).toHaveBeenNthCalledWith(1, { compress: 0.75, format: "webp" });
    expect(manipulatorMocks.saveAsync).toHaveBeenNthCalledWith(2, { compress: 0.55, format: "webp" });
  });

  it("throws if all encode attempts exceed the limit", async () => {
    // All attempts return sizes over 1 MiB
    mockFetch([2 * 1024 * 1024, 2 * 1024 * 1024, 2 * 1024 * 1024]);

    await expect(shrinkImage("file:///huge.jpg")).rejects.toThrow(
      /too large to upload, even compressed/i
    );
  });

  it("throws a readable error if image encoding fails", async () => {
    manipulatorMocks.manipulate.mockImplementationOnce(() => {
      throw new Error("decode failed");
    });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(shrinkImage("file:///odd.heic")).rejects.toThrow(
      /couldn't process that image/i
    );

    spy.mockRestore();
  });

  it("reports a failed encode as unprocessable, not as too large", async () => {
    manipulatorMocks.saveAsync.mockRejectedValue(new Error("webp encoder unavailable"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(shrinkImage("file:///pic.jpg")).rejects.toThrow(/couldn't process that image/i);

    spy.mockRestore();
  });
});
