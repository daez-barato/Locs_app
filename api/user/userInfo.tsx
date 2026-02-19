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

export const updateProfilePicture = async (imageUri: string):
    Promise<
    { error: false; user: UserProfile}
    | { error: true; msg: string }
    > => {
    try {
        const formData = new FormData();
        formData.append("image", {
            uri: imageUri,
            name: "profile.jpg",
            type: "image/jpeg",
        } as any);

        const result = await axiosInstance.put(`/users/settings/uploadProfilePicture`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (result.status !== 201) {
            throw new Error("Failed to update profile picture");
        };

        return {...result.data as {user: UserProfile }, error: false};

    } catch (err){
        return {error: true, msg: "An error occurred"};      
    }
};
