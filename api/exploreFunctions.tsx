import axiosInstance from "./utils/axiosInstance";

export const fetchTrending = async (eventOffset: number = 0, templateOffset: number = 0) => {
    try {
        const response = await axiosInstance.get(`/search/trending/${eventOffset}/${templateOffset}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching trending events:', error.message);
        return [];
    }
};

export const search = async (query: string, eventOffset: number = 0, templateOffset: number = 0, userOffset: number = 0) => {
    try {
        const response = await axiosInstance.get(`/search/searchAll/${encodeURI(query)}/${eventOffset}/${templateOffset}/${userOffset}`);

        if (response.status !== 200) {
            throw new Error(`Error: ${response.statusText}`);
        };

        return response.data;
    } catch (error: any) {
        console.error('Error fetching search results:', error.message);
        return [];
    }
};