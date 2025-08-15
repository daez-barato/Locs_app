import axiosInstance from "./utils/axiosInstance";


export const fetchUserLiveEvents = async () => {
    try {
        const response = await axiosInstance.get(`/event/getUserLiveEvents`);
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Unexpected response format for live events:', response.data);
            return [];
        };
        return response.data;
    } catch (error: any) {
        console.error('Error fetching live events:', error.message);
        return [];
    }
};

export const fetchUserLiveBets = async () => {
    try {
        const response = await axiosInstance.get(`/event/getUserLiveBets`);
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Unexpected response format for live bets:', response.data);
            return [];
        };
        return response.data;
    } catch (error: any) {
        console.error('Error fetching live bets:', error.message);
        return [];
    }
};