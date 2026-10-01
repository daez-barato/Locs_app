import { Bet } from "@/types/interfaces";
import { EventBetPayload } from "@/types/rpc";

/**
 * Builds the per-question pot tallies the event screen renders, plus how many
 * distinct people have a stake on the event.
 *
 * A bet on a question the event no longer lists is ignored, and so is a bet
 * on an option the question no longer lists (e.g. a stale cache) — without
 * this guard, `optionPots[option] += amount` on a missing key adds to
 * `undefined` and poisons that pot with `NaN`. Ignoring the whole bet rather
 * than only its option pot keeps totalPot and optionPots consistent with each
 * other.
 *
 * `bettorCount` counts every bet's `user_id`, including bets on unknown
 * questions/options — matching the screen's previous inline behaviour, where
 * the distinct-bettor count was never filtered by whether the bet matched a
 * known question.
 */
export function tallyBets(
  questions: Record<string, string[]>,
  bets: EventBetPayload[],
  viewerUsername: string
): { betInfos: Record<string, Bet>; bettorCount: number } {
  const betInfos: Record<string, Bet> = {};

  for (const [question, options] of Object.entries(questions)) {
    betInfos[question] = {
      totalPot: 0,
      optionPots: Object.fromEntries(options.map((option) => [option, 0])),
    };
  }

  for (const bet of bets) {
    const info = betInfos[bet.question];
    if (!info || !(bet.option in info.optionPots)) continue;

    info.totalPot += bet.amount;
    info.optionPots[bet.option] += bet.amount;

    if (bet.username === viewerUsername) {
      info.userBet = {
        options: {
          ...info.userBet?.options,
          [bet.option]: bet.payout ?? bet.amount,
        },
      };
    }
  }

  return {
    betInfos,
    bettorCount: new Set(bets.map((b) => b.user_id)).size,
  };
}
