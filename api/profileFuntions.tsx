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

export const getFollowerCount = async (username: string) => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowerCount/${username}`);
    
    return result.data.followers; // Return the follower count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message }
  }
};

export const getFollowingCount = async (username: string) => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowingCount/${username}`);
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
    return null   
  }
};

export const checkIfFollowing = async (username: string) => {
  try {
    const result = await axiosInstance.get(`/followers/checkFollowing/${username}`);
    return result.data.isFollowing; // Return the following count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const getFollowingList = async (username: string) => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowing/${username}`);
    return result.data.followingList; // Return the following count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const getFollowersList = async (username: string) => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowers/${username}`);
    return result.data.followersList; // Return the following count
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};