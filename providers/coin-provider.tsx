import { CoinContext } from "@/hooks/use-coin-context";
import { supabase } from "@/lib/supabase";
import { PropsWithChildren, useEffect, useState } from "react";

export const CoinProvider = ({ children }: PropsWithChildren) => {
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const subscribeToCoinUpdates = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) return;

      channel = supabase
        .channel(`user:${userId}:coins`, { config: { private: true } })
        .on(
          "broadcast",
          { event: "coins_updated" },
          (payload: any) => {
            if (!isMounted) return;
            const newCoins = payload?.coins;

            if (typeof newCoins === "number") {
              setCoins(newCoins);
            } else {
              console.log("coins_updated payload:", payload);
            }
          }
        )
        .subscribe();
    };

    subscribeToCoinUpdates();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <CoinContext.Provider value={{ coins, setCoinAmount: setCoins }}>
      {children}
    </CoinContext.Provider>
  );
};