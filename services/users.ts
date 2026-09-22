import { UserProfile, Event, SearchUser } from "../types/interfaces";
import { supabase } from "@/lib/supabase";


export const getUserProfile = async (username: string): Promise<UserProfile | null> => {
    try {
        console.log(`Fetching user profile for username: ${username}`);
        const {data, error} = await supabase.rpc(`get_user_profile`, { username: username });

        if (error || data.length === 0) {
            throw new Error(error?.message || 'User profile not found');
        }

        return UserProfile(data[0]);

    } catch (err){
      console.error('Error fetching user profile:', err);
      return null
    }
};

export const fetchUserCreatedEvents = async (username: string, offset: number = 0) :Promise<Event[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_created_events`, { username: username, page_offset: offset });

    if (error) {
        throw new Error(error.message);
    };

    return data.map((event: any) => Event(event));
  } catch (err) {
    console.error('Error fetching user created events:', err);
    return []
  }
};

export const fetchUserParticipatedEvents = async (username: string, offset: number = 0) : Promise<Event[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_participated_events`, { username: username, page_offset: offset });
    if (error) {
      throw new Error(error.message);
    }
    return data.map((event: any) => Event(event));
  } catch (err) {
    console.error('Error fetching user participated events:', err);
    return [];
  }
};

export const getFollowersList = async (username: string, offset: number = 0) : Promise<SearchUser[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_followers`, { username, page_offset: offset });
    if (error) {
      throw new Error(error.message);
    }

    return data.map((user: any) => SearchUser(user));
  } catch (err) {
    return [];
  }
};

export const getFollowingList = async (username: string, offset: number = 0) : Promise<SearchUser[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_following`, { username, page_offset: offset });
    if (error) {
      throw new Error(error.message);
    }
    return data.map((user: any) => SearchUser(user));
  } catch (err) {
    return [];
  }
};

export const getRequestsList = async (username: string) : Promise<SearchUser[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_follow_requests`, { username });
    if (error) {
      throw new Error(error.message);
    }
    return data.map((user: any) => SearchUser(user));
  } catch (err) {
    return [];
  }
};

export const changePrivacy = async (isPublic: boolean) => {
  try {
    const { data, error } = await supabase.rpc("set_user_privacy", { _public: isPublic });

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || "Failed to update privacy");
    }

    return { error: false, public: data[0].public };
  } catch (err: any) {
    console.error("Error changing privacy:", err);
    return { error: true, msg: err.message };
  }
};

export const updateProfilePicture = async (uri: string) => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth.user?.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = blob.type?.split("/")[1] || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatar")
      .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data, error } = await supabase.rpc("update_avatar", { _avatar_url: path });

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || "Failed to update avatar");
    }

    const { data: publicUrl } = supabase.storage.from("avatar").getPublicUrl(path);

    return { error: false, avatar_url: publicUrl.publicUrl };
  } catch (err: any) {
    console.error("Error updating profile picture:", err);
    return { error: true, msg: err.message };
  }
};


    
