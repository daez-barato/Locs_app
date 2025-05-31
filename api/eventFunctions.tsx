import axiosInstance from "./utils/axiosInstance";


export type BetInfo = {
  id: string;
  title: string;
  description: string;
  expire_date: string;
  decided: boolean;
  locked: boolean;
  // Add any other fields your API returns
};

export const eventInformation = async (eventId: string): Promise<BetInfo> => {
  const response = await axiosInstance.get(`/event/${eventId}`);
  return response.data;
};
