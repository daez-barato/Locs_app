/**
 * The RPC payloads and the screens disagree on shape, and every mismatch this
 * week reached a device: get_event_information_db returns the creator as flat
 * fields and questions keyed by title with ids nested, while the event screen
 * wants a nested creator and plain option titles. These lock that translation
 * down.
 */
jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

import { supabase } from "@/lib/supabase";
import { eventInformation, fetchEventBets, placeBet, endEvent } from "@/api/eventFunctions";

const mockRpc = supabase.rpc as unknown as jest.Mock;
const mockGetUser = supabase.auth.getUser as unknown as jest.Mock;
const mockFrom = supabase.storage.from as unknown as jest.Mock;
const mockCreateSignedUrl = jest.fn();

const EVENT_ID = "11111111-1111-1111-1111-111111111111";
const CREATOR_ID = "22222222-2222-2222-2222-222222222222";

const payload = {
  expire_date: "2027-01-01T00:00:00+00:00",
  locked: false,
  decided: false,
  public: true,
  event_creator_id: CREATOR_ID,
  event_creator: "alice",
  avatar_url: null,
  image_url: "user/pic.jpg",
  template_id: "33333333-3333-3333-3333-333333333333",
  title: "Cup Final",
  description: "who lifts it",
  template_creator_id: CREATOR_ID,
  is_following: false,
  has_requested: false,
  template_saved: false,
  template_posted: null,
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

beforeEach(() => {
  mockRpc.mockReset();
  mockGetUser.mockReset().mockResolvedValue({ data: { user: { id: "viewer" } } });
  mockCreateSignedUrl.mockReset().mockResolvedValue({ data: { signedUrl: "https://signed" } });
  mockFrom.mockReset().mockReturnValue({ createSignedUrl: mockCreateSignedUrl });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("eventInformation", () => {
  it("nests the creator the screen reads as eventInfo.creator", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const event: any = await eventInformation(EVENT_ID);

    // reading .creator.username on the flat payload is what crashed the screen
    expect(event.creator).toEqual({
      id: CREATOR_ID,
      username: "alice",
      avatar_url: null,
      is_following: false,
      has_requested: false,
    });
  });

  it("flattens questions to option titles for the title-keyed screen state", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const event: any = await eventInformation(EVENT_ID);

    expect(event.questions).toEqual({ "Who wins?": ["A", "B"] });
  });

  it("signs the private thumbnail path into a renderable url", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const event: any = await eventInformation(EVENT_ID);

    expect(mockFrom).toHaveBeenCalledWith("event-thumbnail");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("user/pic.jpg", expect.any(Number));
    expect(event.thumbnail_url).toBe("https://signed");
  });

  it("marks the viewer as creator only when the ids match", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });
    expect(((await eventInformation(EVENT_ID)) as any).is_creator).toBe(false);

    mockGetUser.mockResolvedValue({ data: { user: { id: CREATOR_ID } } });
    mockRpc.mockResolvedValue({ data: payload, error: null });
    expect(((await eventInformation(EVENT_ID)) as any).is_creator).toBe(true);
  });

  it("returns an error result rather than throwing", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const event = await eventInformation(EVENT_ID);
    expect(event).toEqual({ error: true, msg: "boom" });
  });
});

describe("fetchEventBets", () => {
  it("always yields an array, since the screen iterates it directly", async () => {
    // the RPC returns null for an unauthenticated caller
    mockRpc.mockResolvedValue({ data: null, error: null });

    const bets = await fetchEventBets(EVENT_ID);
    expect(Array.isArray(bets)).toBe(true);
    expect(bets).toHaveLength(0);
  });

  it("passes bet rows through", async () => {
    mockRpc.mockResolvedValue({
      data: [{ user_id: "u", username: "bob", question: "Who wins?", option: "A", amount: 5, payout: null }],
      error: null,
    });

    const bets: any = await fetchEventBets(EVENT_ID);
    expect(bets[0].amount).toBe(5);
  });
});

describe("placeBet", () => {
  it("resolves titles to the ids add_bet requires", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });
    await eventInformation(EVENT_ID); // populates the id lookup

    mockRpc.mockReset().mockResolvedValue({ error: null });
    await placeBet(EVENT_ID, "Who wins?", "B", 7);

    expect(mockRpc).toHaveBeenCalledWith("add_bet", {
      _event_id: EVENT_ID,
      _question_id: 1,
      _option_id: 2,
      _amount: 7,
    });
  });

  it("refuses a title it has no id for instead of sending a bad request", async () => {
    const result: any = await placeBet("unknown-event", "Who wins?", "A", 1);

    expect(result.error).toBe(true);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe("endEvent", () => {
  it("sends one winner per question, keyed by id", async () => {
    mockRpc.mockResolvedValue({ data: payload, error: null });
    await eventInformation(EVENT_ID);

    mockRpc.mockReset().mockResolvedValue({ error: null });
    await endEvent(EVENT_ID, { "Who wins?": "A" });

    // duplicate question_ids here violate event_winning_options_pkey
    expect(mockRpc).toHaveBeenCalledWith("decide_event", {
      _event_id: EVENT_ID,
      _winners: [{ question_id: 1, option_id: 1 }],
    });
  });
});
