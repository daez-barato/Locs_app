import { EventBetPayload } from "@/types/rpc";

export type BettorPick = {
  question: string;
  option: string;
  amount: number;
  /** what the stake paid out once the event was decided; null before */
  payout: number | null;
};

export type Bettor = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  /** coins staked across every question */
  staked: number;
  /** coins won across every question, or null while undecided */
  won: number | null;
  picks: BettorPick[];
};

/**
 * Turns the event's bet rows (one per person per question) into one entry per
 * person, biggest stake first. Picks keep the order the questions appear in,
 * when that order is given.
 */
export function groupBettors(bets: EventBetPayload[], questionOrder: string[] = []): Bettor[] {
  const byUser = new Map<string, Bettor>();

  for (const bet of bets) {
    let bettor = byUser.get(bet.user_id);
    if (!bettor) {
      bettor = {
        userId: bet.user_id,
        username: bet.username,
        avatarUrl: bet.avatar_url ?? null,
        staked: 0,
        won: null,
        picks: [],
      };
      byUser.set(bet.user_id, bettor);
    }
    bettor.staked += bet.amount;
    if (bet.payout != null) bettor.won = (bettor.won ?? 0) + bet.payout;
    bettor.picks.push({ question: bet.question, option: bet.option, amount: bet.amount, payout: bet.payout });
  }

  const rank = (question: string) => {
    const index = questionOrder.indexOf(question);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return Array.from(byUser.values())
    .map((bettor) => ({ ...bettor, picks: bettor.picks.sort((a, b) => rank(a.question) - rank(b.question)) }))
    .sort((a, b) => b.staked - a.staked || a.username.localeCompare(b.username));
}
