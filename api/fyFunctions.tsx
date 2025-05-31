
import { SERVER_PORT } from "./config";
import axiosInstance from "./utils/axiosInstance";


export type Recommendation = {
  id: string;
  title: string;
  description: string;
}


export const userRecommendations = async () => {
    try {
        const result = await axiosInstance.get(`${SERVER_PORT}/recomendations/userRecommendations`);

        return result.data.recommendations as Recommendation[];

    } catch (err){
      console.error('Error fetching recommendations', err);
      return []       
    }
}