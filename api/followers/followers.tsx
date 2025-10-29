import { AxiosError } from "axios";
import { SearchUser } from "../interfaces/objects";
import axiosInstance from "../utils/axiosInstance";

export const getFollowersList = async (id: string, offset: number = 0) :
  Promise<
    { error: true; msg: string }
    | { error: false; list: SearchUser[] }
  > => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowers/${id}/${offset}`);
    return { list: result.data.followersList, error: false}; 
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const getFollowingList = async (id: string, offset: number = 0) :
    Promise<
    { error: true; msg: string }
    | { error: false; list: SearchUser[] }
  > => {
  try {
    const result = await axiosInstance.get(`/followers/userFollowing/${id}/${offset}`);
    return { list: result.data.followingList, error: false};
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const followRequest = async (followed: string) => {
  try {
    const result = await axiosInstance.post(`followers/request/${followed}`);

    return result.data

  } catch (err: any) {
    console.error("Error Following:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const unfollowRequest = async (unfollowed: string) => {
  try {
    const result = await axiosInstance.delete(`followers/unfollow/${unfollowed}`);

    return result.data

  } catch (err: any) {
    console.error("Error unfollowing:", err);
    return { error: true, msg:  err.response.data.error };
  }
};

export const acceptFollowRequest = async (requester: string) => {
    try {

        const result = await axiosInstance.post(`followers/accept/${requester}`);

        return result.data

    } catch (err: any) {
        console.error("Error accepting:", err)
        return { error: true, msg:  err.response.data.error };
    }
}

export const rejectFollowRequest = async (requester: string) => {
    try {
        const result = await axiosInstance.delete(`followers/reject/${requester}`);

        return result.data
    } catch (err: any) {
        console.error("Error accepting:", err)
        return { error: true, msg:  err.response.data.error };
    }
};

export const updateRequests = async (id: string) :
    Promise<
    { error: true; msg: string }
    | { error: false; requests: SearchUser[] }
  > => {
  try {
    const result = await axiosInstance.get(`/followers/requests/${id}`);
    return { requests: result.data.list, error: false};
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};