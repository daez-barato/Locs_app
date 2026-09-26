import { CoinContext } from "@/hooks/use-coin-context";
import { useAuthContext } from "@/hooks/use-auth-context";
import { getMyCoins } from "@/services/users";
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

/**
 * The signed-in user's balance, refreshed on demand rather than pushed.
 *
 * It used to hold a private Realtime channel open for a `coins_updated`
 * broadcast, but the project has no realtime.messages policy, so private
 * subscriptions were refused and nothing ever arrived. Balances change at
 * moments the app already knows about (its own bets, purchases, decisions) or
 * on the cron jobs (6-hourly top-ups, midnight refunds), so reading the
 * balance after those actions, on pull-to-refresh, on screen focus and when
 * the app returns to the foreground covers every case without a socket.
 */
export const CoinProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuthContext();
  const userId = user?.id;
  const [coins, setCoins] = useState<number>(0);

  // Drops responses for a previous account that land after a logout or switch.
  const currentUser = useRef(userId);
  currentUser.current = userId;

  const refreshCoins = useCallback(async () => {
    const requestedFor = currentUser.current;
    if (!requestedFor) return;
    const balance = await getMyCoins();
    if (balance !== null && currentUser.current === requestedFor) {
      setCoins(balance);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setCoins(0);
      return;
    }
    refreshCoins();
  }, [userId, refreshCoins]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshCoins();
    });
    return () => sub.remove();
  }, [refreshCoins]);

  return (
    <CoinContext.Provider value={{ coins, setCoinAmount: setCoins, refreshCoins }}>
      {children}
    </CoinContext.Provider>
  );
};
