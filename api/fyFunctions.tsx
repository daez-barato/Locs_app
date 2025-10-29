import { Event } from "./interfaces/objects";
import axiosInstance from "./utils/axiosInstance";


export const fetchFollowingPosts = async (offset: number): Promise<
  {error: true; message: string}
  | {error: false; events: Event[] }
  > => {
  try {
    const response = await axiosInstance.get(`event/getUserFollowingPosts/${offset}`);

    if (response.status !== 200) {
      throw new Error(`Error fetching following posts: ${response.statusText}`);
    };

    return {error: false , events: response.data.posts as Event[]};

  } catch (error) {
    return {error: true, message: 'Failed to fetch following posts'};
  }
}