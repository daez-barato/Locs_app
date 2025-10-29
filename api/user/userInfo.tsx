import axiosInstance from "../utils/axiosInstance";
import { UserProfile } from "../interfaces/objects";


export const getUserProfile = async (id : string): 
    Promise<
    { error: false; user: UserProfile}
    | { error: true; msg: string }
    > => {
    try {
        const result = await axiosInstance.get(`/users/profile/${id}`);

        if (result.status !== 200) {
            throw new Error("Failed to fetch user profile data");
        };

        return {...result.data as {user: UserProfile }, error: false};

    } catch (err){
        return {error: true, msg: "An error occurred"};      
    }
};

export const changePrivacy = async (): 
    Promise<
    { error: false; public: boolean}
    | { error: true; msg: string }
    > => {
    try {
        const result = await axiosInstance.patch(`/users/settings/changePrivacy`);

        if (result.status !== 200) {
            throw new Error("Failed to fetch user profile data");
        };

        return {public: result.data.public, error: false};

    } catch (err){
        return {error: true, msg: "An error occurred"};      
    }
};
