import { supabase } from "@/lib/supabase";

export const followRequest = async (followed: string) => {
  try {
    const { data, error } = await supabase.rpc("follow_user", { _target_id: followed });

    if (error) {
      throw new Error(error.message);
    }

    const status = data?.[0]?.status;

    return {
      error: false,
      following: status === "following",
      requested: status === "pending",
    };
  } catch (err: any) {
    console.error("Error Following:", err);
    return { error: true as const, message: err.message };
  }
};

export const unfollowRequest = async (unfollowed: string) => {
  try {
    const { error } = await supabase.rpc("unfollow_user", { _target_id: unfollowed });

    if (error) {
      throw new Error(error.message);
    }

    return { error: false as const };
  } catch (err: any) {
    console.error("Error unfollowing:", err);
    return { error: true as const, message: err.message };
  }
};

export const acceptFollowRequest = async (requester: string) => {
  try {
    const { error } = await supabase.rpc("accept_follow_request", { _requester_id: requester });

    if (error) {
      throw new Error(error.message);
    }

    return { error: false as const };
  } catch (err: any) {
    console.error("Error accepting:", err);
    return { error: true as const, message: err.message };
  }
};

export const rejectFollowRequest = async (requester: string) => {
  try {
    const { error } = await supabase.rpc("reject_follow_request", { _requester_id: requester });

    if (error) {
      throw new Error(error.message);
    }

    return { error: false as const };
  } catch (err: any) {
    console.error("Error accepting:", err);
    return { error: true as const, message: err.message };
  }
};
