import { createContext, useContext } from "react";

export type coinProps = {
    coins: number;
    setCoinAmount: (amount: number) => void;
};

export const CoinContext = createContext<coinProps>({
    coins: 0,
    setCoinAmount: () => null
});

export const useCoinContext = () => useContext(CoinContext);