import { UserProfile, Event, SearchUser } from "../types/interfaces";
import { supabase } from "@/lib/supabase";
import { signThumbnails } from "@/utils/image-upload";
import { CreatedEventRow, ParticipatedEventRow } from "@/types/rpc";


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


// get_user_created_events/get_user_participated_events return event_id,
// template_title and template_image_url, but Event() reads id/title/
// thumbnail_url — mapping straight through left every row with id undefined,
// which routed taps to /event/undefined and gave every card the same React key.
function profileRowToEvent(
  row: CreatedEventRow | ParticipatedEventRow,
  viewerId?: string
): Event {
  return Event({
    id: row.event_id,
    template_id: row.template_id,
    expire_date: row.expire_date,
    title: row.template_title,
    description: row.template_description,
    locked: row.locked,
    decided: row.decided,
    thumbnail_url: row.template_image_url,
    creator_username: row.creator_username,
    is_creator: !!viewerId && row.creator_id === viewerId,
    participants_count: row.participants_count ?? 0,
    total_pot: row.total_pot_amount,
    likes_count: row.likes_count,
    public: row.is_public,
  });
}

export const fetchUserCreatedEvents = async (username: string, offset: number = 0) :Promise<Event[]> => {
  try {
    const {data, error} = await supabase.rpc(`get_user_created_events`, { username: username, page_offset: offset });

    if (error) {
        throw new Error(error.message);
    };

    const { data: userAuth } = await supabase.auth.getUser();
    return await signThumbnails<Event>(data.map((e) => profileRowToEvent(e, userAuth.user?.id)));
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
    const { data: userAuth } = await supabase.auth.getUser();
    return await signThumbnails<Event>(data.map((e) => profileRowToEvent(e, userAuth.user?.id)));
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
    console.error('Error fetching followers list:', err);
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
    console.error('Error fetching following list:', err);
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
    console.error('Error fetching follow requests:', err);
    return [];
  }
};

export const changePrivacy = async (isPublic: boolean) => {
  try {
    const { data, error } = await supabase.rpc("set_user_privacy", { _public: isPublic });

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || "Failed to update privacy");
    }

    return { error: false as const, public: data[0].public };
  } catch (err: any) {
    console.error("Error changing privacy:", err);
    return { error: true as const, msg: err.message };
  }
};



    
/**
 * The signed-in user's current coin balance, or null if it couldn't be read.
 * The coin provider keeps the balance live by broadcast; this is for screens
 * that want to re-sync on focus in case a broadcast was missed.
 */
export const getMyCoins = async (): Promise<number | null> => {
  try {
    const { data, error } = await supabase.rpc("get_my_profile");
    if (error || !data || data.length === 0) {
      throw new Error(error?.message || "Profile not found");
    }
    return data[0].coins ?? 0;
  } catch (err) {
    console.error("Error fetching coin balance:", err);
    return null;
  }
};
