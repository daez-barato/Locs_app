/**
 * The event screen renders pots straight from this tally, so a wrong sum or
 * a missing guard here shows up as a wrong number on screen — this is where
 * that logic is covered without a simulator.
 */
import { tallyBets } from "@/utils/bet-tally";
import { EventBetPayload } from "@/types/rpc";

const QUESTIONS = { "Who wins?": ["A", "B"], "Second question": ["C", "D"] };

const bet = (overrides: Partial<EventBetPayload>): EventBetPayload => ({
  user_id: "u1",
  username: "alice",
  avatar_url: null,
  question: "Who wins?",
  option: "A",
  amount: 5,
  payout: null,
  ...overrides,
});

describe("tallyBets", () => {
  it("returns zeroed pots for every question and option when there are no bets", () => {
    const { betInfos, bettorCount } = tallyBets(QUESTIONS, [], "alice");

    expect(betInfos).toEqual({
      "Who wins?": { totalPot: 0, optionPots: { A: 0, B: 0 } },
      "Second question": { totalPot: 0, optionPots: { C: 0, D: 0 } },
    });
    expect(bettorCount).toBe(0);
  });

  it("sums pots per option and per question", () => {
    const { betInfos } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", option: "A", amount: 5 }),
      bet({ user_id: "u2", username: "bob", option: "A", amount: 3 }),
      bet({ user_id: "u3", username: "carol", option: "B", amount: 2 }),
      bet({ user_id: "u1", username: "alice", question: "Second question", option: "C", amount: 10 }),
    ], "nobody");

    expect(betInfos["Who wins?"]).toEqual({
      totalPot: 10,
      optionPots: { A: 8, B: 2 },
    });
    expect(betInfos["Second question"]).toEqual({
      totalPot: 10,
      optionPots: { C: 10, D: 0 },
    });
  });

  it("records the viewer's own bet amount as userBet", () => {
    const { betInfos } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", option: "A", amount: 5 }),
    ], "alice");

    expect(betInfos["Who wins?"].userBet).toEqual({ options: { A: 5 } });
  });

  it("uses the payout instead of the stake once the event has paid out", () => {
    const { betInfos } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", option: "A", amount: 5, payout: 8 }),
    ], "alice");

    expect(betInfos["Who wins?"].userBet).toEqual({ options: { A: 8 } });
  });

  it("merges the viewer's bets on multiple options of the same question", () => {
    const { betInfos } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", option: "A", amount: 5 }),
      bet({ user_id: "u1", username: "alice", option: "B", amount: 3 }),
    ], "alice");

    expect(betInfos["Who wins?"].userBet).toEqual({ options: { A: 5, B: 3 } });
  });

  it("ignores a bet on a question the event no longer lists", () => {
    const { betInfos, bettorCount } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", question: "Retired question", option: "Z", amount: 100 }),
    ], "alice");

    expect(betInfos["Retired question"]).toBeUndefined();
    expect(betInfos["Who wins?"]).toEqual({ totalPot: 0, optionPots: { A: 0, B: 0 } });
    // Still counts toward distinct bettors, matching the screen's prior
    // behaviour of counting every bet row regardless of question validity.
    expect(bettorCount).toBe(1);
  });

  it("ignores a bet on an option the question no longer lists, without producing NaN", () => {
    const { betInfos } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", option: "Z", amount: 100 }),
      bet({ user_id: "u2", username: "bob", option: "A", amount: 5 }),
    ], "alice");

    expect(betInfos["Who wins?"]).toEqual({ totalPot: 5, optionPots: { A: 5, B: 0 } });
    expect(betInfos["Who wins?"].optionPots.Z).toBeUndefined();
    expect(Number.isNaN(betInfos["Who wins?"].totalPot)).toBe(false);
  });

  it("counts distinct bettors, not distinct bet rows", () => {
    const { bettorCount } = tallyBets(QUESTIONS, [
      bet({ user_id: "u1", username: "alice", question: "Who wins?", option: "A", amount: 5 }),
      bet({ user_id: "u1", username: "alice", question: "Second question", option: "C", amount: 10 }),
      bet({ user_id: "u2", username: "bob", option: "B", amount: 1 }),
    ], "alice");

    expect(bettorCount).toBe(2);
  });
});
