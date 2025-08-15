
import { Event } from "@/components/eventCard";
import { SERVER_PORT } from "./config";
import axiosInstance from "./utils/axiosInstance";


export const fetchFollowingPosts = async () => {
  try {
    const response = await axiosInstance.get(`event/getUserFollowingPosts`);
    if (response.status !== 200) {
      throw new Error(`Error fetching following posts: ${response.statusText}`);
    };
    return response.data.posts as Event[];
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return [];
  }
}