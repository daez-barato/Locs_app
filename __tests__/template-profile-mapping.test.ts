/**
 * Regression cover for the two mapping bugs that reached devices:
 * get_template_by_id returns a flat object the studio read as
 * templateInfo.template.title, and the profile event RPCs return event_id /
 * template_title where Event() reads id / title — which routed taps to
 * /event/undefined and gave every card the same React key.
 */
jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

import { supabase } from "@/lib/supabase";
import { fetchTemplate } from "@/api/studioFunctions";
import { fetchUserCreatedEvents } from "@/services/users";

const mockRpc = supabase.rpc as unknown as jest.Mock;
const mockGetUser = supabase.auth.getUser as unknown as jest.Mock;
const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockCreateSignedUrl = jest.fn();
const mockCreateSignedUrls = jest.fn();

beforeEach(() => {
  mockRpc.mockReset();
  mockGetUser.mockReset().mockResolvedValue({ data: { user: { id: "viewer" } } });
  mockCreateSignedUrl.mockReset().mockResolvedValue({ data: { signedUrl: "https://signed" } });
  mockCreateSignedUrls.mockReset().mockResolvedValue({
    data: [{ path: "u/t.jpg", signedUrl: "https://signed-list" }],
    error: null,
  });
  mockFrom.mockReset().mockReturnValue({
    createSignedUrl: mockCreateSignedUrl,
    createSignedUrls: mockCreateSignedUrls,
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("fetchTemplate", () => {
  const flat = {
    template_id: "t-1",
    title: "Cup Final",
    description: "who lifts it",
    thumbnail_url: "u/t.jpg",
    creator_id: "c-1",
    is_public: true,
    questions: {
      "Who wins?": {
        question_id: 1,
        options: [
          { option_id: 1, title: "A" },
          { option_id: 2, title: "B" },
        ],
      },
    },
  };

  it("nests the template the studio reads as templateInfo.template", async () => {
    mockRpc.mockResolvedValue({ data: flat, error: null });

    const result: any = await fetchTemplate("t-1");

    expect(result.template.title).toBe("Cup Final");
    expect(result.template.id).toBe("t-1");
  });

  it("flattens questions into the studio's optionsDict shape", async () => {
    mockRpc.mockResolvedValue({ data: flat, error: null });

    const result: any = await fetchTemplate("t-1");

    expect(result.questions).toEqual({ "Who wins?": ["A", "B"] });
  });

  it("signs the thumbnail for display", async () => {
    mockRpc.mockResolvedValue({ data: flat, error: null });

    const result: any = await fetchTemplate("t-1");

    expect(result.template.image).toBe("https://signed");
  });

  it("returns an error result when the template is missing", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result: any = await fetchTemplate("nope");
    expect(result.error).toBe(true);
  });
});

describe("fetchUserCreatedEvents", () => {
  const row = {
    event_id: "e-1",
    creator_id: "c-1",
    creator_username: "alice",
    template_id: "t-1",
    expire_date: "2027-01-01T00:00:00+00:00",
    locked: false,
    decided: false,
    is_public: true,
    created_at: "2026-01-01T00:00:00+00:00",
    template_title: "Cup Final",
    template_description: "who lifts it",
    template_image_url: "u/t.jpg",
    total_pot_amount: 12,
    likes_count: 3,
    participants_count: 4,
  };

  it("maps event_id to id, so cards route somewhere real", async () => {
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const events = await fetchUserCreatedEvents("alice");

    // reading row.id gave undefined -> /event/undefined and duplicate React keys
    expect(events[0].id).toBe("e-1");
    expect(events[0].id).not.toBeUndefined();
  });

  it("maps template_title and template_description onto the card fields", async () => {
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const events = await fetchUserCreatedEvents("alice");

    expect(events[0].title).toBe("Cup Final");
    expect(events[0].description).toBe("who lifts it");
  });

  it("reports the real participant count instead of a hardcoded 0", async () => {
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const events = await fetchUserCreatedEvents("alice");
    expect(events[0].participants_count).toBe(4);
  });

  it("signs list thumbnails", async () => {
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const events = await fetchUserCreatedEvents("alice");
    expect(events[0].thumbnail_url).toBe("https://signed-list");
  });

  it("flags the viewer's own events", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "c-1" } } });
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const events = await fetchUserCreatedEvents("alice");
    expect(events[0].is_creator).toBe(true);
  });

  it("calls the RPC with username, which is the parameter it declares", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await fetchUserCreatedEvents("alice", 20);

    // passing user_id here silently returned nothing for every list
    expect(mockRpc).toHaveBeenCalledWith("get_user_created_events", {
      username: "alice",
      page_offset: 20,
    });
  });
});
