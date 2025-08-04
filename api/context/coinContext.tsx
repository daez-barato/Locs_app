import React, { createContext, useContext, useEffect, useState } from "react";
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
            const result = await axiosInstance.post(`/coins/createCoinTransaction`, {amount});
            setCoins(result.data.coins);
        } catch(err){
            console.error("Failed transaction: ", err);
        }
    }

    const fetchCoins = async () => {
        try {
            const result = await axiosInstance.get(`/coins/getUserCoins`);

            if (!(result.status === 200 && result.data?.coins !== undefined)) {
                throw new Error("Error fetching coins")
            }
            setCoins(result.data.coins);
        } catch (err) {
            console.error("Failed to fetch coins:", err);
        }
    };

    useEffect(() => {
      fetchCoins();
    }, []);

    return (
        <CoinContext.Provider value={{ coins, tradeCoins, fetchCoins }}>
            {children}
        </CoinContext.Provider>
    );
};

export const useCoins = () => useContext(CoinContext);