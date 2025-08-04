import { AxiosError } from "axios"
import { SERVER_PORT } from "./config";
import axiosInstance from "./utils/axiosInstance";


export const userInfo = async () => {
    try {
        const result = await axiosInstance.get(`/users/user`);

        return result.data;

    } catch (err){
      return {error: true, msg: (err as AxiosError).message };        
    }
}

export const getFollowerCount = async () => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowerCount`);
    
    return result.data.followers; // Return the follower count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message }
  }
};

export const getFollowingCount = async () => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowingCount`);
    return result.data.following; // Return the following count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const fetchUserData = async (user: string) => {

  try {
    const result = await axiosInstance.get(`/users/user/${user}`);
    if (result.status !== 200) {
        throw new Error("Failed to fetch user data");
    }

    return result.data;

  } catch (err: any){
    console.error('Error fetching user data:', err.message);
    return []       
  }
}