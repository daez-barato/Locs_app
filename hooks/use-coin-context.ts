import { createContext, useContext } from "react";

export type coinProps = {
    coins: number;
    /** set the balance when an RPC already returned it (e.g. a purchase) */
    setCoinAmount: (amount: number) => void;
    /** re-read the balance after anything that may have changed it */
    refreshCoins: () => Promise<void>;
};

export const CoinContext = createContext<coinProps>({
    coins: 0,
    setCoinAmount: () => null,
    refreshCoins: async () => {},
});

export const useCoinContext = () => useContext(CoinContext);