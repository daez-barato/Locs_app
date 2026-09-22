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

      // Coins only ever arrived by broadcast, so the balance sat at 0 until the
      // user's next coin change. Load the real balance up front.
      const { data: profile, error } = await supabase.rpc("get_my_profile");

      if (!error && profile?.[0] && isMounted) {
        setCoins(profile[0].coins ?? 0);
      }

      channel = supabase
        .channel(`user:${userId}:coins`, { config: { private: true } })
        .on(
          "broadcast",
          { event: "coins_updated" },
          (message: any) => {
            if (!isMounted) return;
            // supabase-js delivers { type, event, payload }; the trigger's
            // jsonb lands in payload, not on the message itself.
            const newCoins = message?.payload?.coins ?? message?.coins;

            if (typeof newCoins === "number") {
              setCoins(newCoins);
            }
          }
        )
        .subscribe();
    };

    subscribeToCoinUpdates().catch((err) => {
      console.error("Error subscribing to coin updates:", err);
    });

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
