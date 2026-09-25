/**
 * The bettors sheet shows one row per person, but the RPC returns one row per
 * person per question — the grouping is where totals could go wrong.
 */
import { groupBettors } from "@/utils/bettors";
import { EventBetPayload } from "@/types/rpc";

const bet = (overrides: Partial<EventBetPayload>): EventBetPayload => ({
  user_id: "u1",
  username: "alice",
  avatar_url: null,
  question: "Q1",
  option: "A",
  amount: 5,
  payout: null,
  ...overrides,
});

describe("groupBettors", () => {
  it("merges one person's stakes across questions", () => {
    const [alice] = groupBettors([bet({ question: "Q1", amount: 5 }), bet({ question: "Q2", option: "B", amount: 7 })]);

    expect(alice.staked).toBe(12);
    expect(alice.picks.map((p) => p.option)).toEqual(["A", "B"]);
  });

  it("puts the biggest stake first, then alphabetical", () => {
    const list = groupBettors([
      bet({ user_id: "u1", username: "carol", amount: 3 }),
      bet({ user_id: "u2", username: "bob", amount: 10 }),
      bet({ user_id: "u3", username: "alice", amount: 3 }),
    ]);

    expect(list.map((b) => b.username)).toEqual(["bob", "alice", "carol"]);
  });

  it("orders picks by the event's question order", () => {
    const [alice] = groupBettors([bet({ question: "Q2" }), bet({ question: "Q1" })], ["Q1", "Q2"]);

    expect(alice.picks.map((p) => p.question)).toEqual(["Q1", "Q2"]);
  });

  it("sums payouts once decided, and leaves won null before", () => {
    const decided = groupBettors([bet({ payout: 8 }), bet({ question: "Q2", payout: 0 })]);
    const open = groupBettors([bet({})]);

    expect(decided[0].won).toBe(8);
    expect(open[0].won).toBeNull();
  });
});
