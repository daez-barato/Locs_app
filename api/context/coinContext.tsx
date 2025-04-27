import React, { createContext, useContext, useState } from "react";
import { SERVER_PORT } from "../config";
import axiosInstance from "../utils/axiosInstance";


interface coinProps{
    coins: number;
    tradeCoins: (amount: number) => void;
    fetchCoins: () => void;
}

const CoinContext = createContext<coinProps>({
    coins: 0,
    tradeCoins: () => null,
    fetchCoins: () => null,
});

export const CoinProvider = ({ children }: { children: React.ReactNode }) => {
    const [coins, setCoins] = useState<number>(0);

    const tradeCoins = async (amount: number) => {
        try {
            const result = await axiosInstance.post(`${SERVER_PORT}/coins/createCoinTransaction`, {amount});
            setCoins(result.data.coins);
        } catch(err){
            console.error("Failed transaction: ", err);
        }
    }

    const fetchCoins = async () => {
        try {
            const result = await axiosInstance.get(`${SERVER_PORT}/coins/getUserCoins`);
            setCoins(result.data.coins);
        } catch (err) {
            console.error("Failed to fetch coins:", err);
        }
    };

    return (
        <CoinContext.Provider value={{ coins, tradeCoins, fetchCoins }}>
            {children}
        </CoinContext.Provider>
    );
};

export const useCoins = () => useContext(CoinContext);