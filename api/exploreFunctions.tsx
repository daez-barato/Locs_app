import axiosInstance from "./utils/axiosInstance";

export const fetchTrending = async () => {
    try {
        const response = await axiosInstance.get(`/search/trending`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching trending events:', error.message);
        return [];
    }
};

export const search = async (query: string) => {
    try {
        const response = await axiosInstance.get(`/search/searchAll/${encodeURI(query)}`);

        if (response.status !== 200) {
            throw new Error(`Error: ${response.statusText}`);
        };

        return response.data;
    } catch (error: any) {
        console.error('Error fetching search results:', error.message);
        return [];
    }
};