import { AxiosError } from "axios"
import axiosInstance from "./utils/axiosInstance";
import { Event } from "./interfaces/objects";

export const fetchUserCreatedEvents = async (id: string, offset: number = 0) :
  Promise<
    { error: true; msg: string }
    | { error: false; events: Event[] }
  > => {
  try {
    const result = await axiosInstance.get(`event/getUserCreatedEvents/${id}/${offset}`);
    return { events: result.data.events, error: false}; 
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};

export const fetchUserParticipatedEvents = async (id: string, offset: number = 0) :
  Promise<
    { error: true; msg: string }
    | { error: false; events: Event[] }
  > => {
  try {
    const result = await axiosInstance.get(`event/getUserParticipatedEvents/${id}/${offset}`);
    return { events: result.data.events, error: false}; 
  } catch (err) {
    return { error: true, msg: (err as AxiosError).message };
  }
};