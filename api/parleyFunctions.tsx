import { supabase } from "@/lib/supabase";
import { Event } from "@/types/interfaces";
import { signThumbnails } from "@/utils/image-upload";

function toEvent(row: any): Event {
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
    is_creator: row.creator_id === row.viewer_id,
    participants_count: row.participants_count ?? 0,
    total_pot: row.total_pot_amount,
    likes_count: row.likes_count,
    public: row.is_public,
  });
}

async function getCurrentUsername(): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_my_profile");

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0].username;
}

export const fetchUserLiveEvents = async () => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const viewerId = userAuth.user?.id;
    const username = await getCurrentUsername();

    if (!username) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.rpc("get_user_created_events", { username });

    if (error) {
      throw new Error(error.message);
    }

    return await signThumbnails<Event>(
      (data ?? [])
        .filter((row: any) => !row.decided)
        .map((row: any) => toEvent({ ...row, viewer_id: viewerId }))
    );
  } catch (error: any) {
    console.error("Error fetching live events:", error.message);
    return [];
  }
};

export const fetchUserLiveBets = async () => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const viewerId = userAuth.user?.id;
    const username = await getCurrentUsername();

    if (!username) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.rpc("get_user_participated_events", { username });

    if (error) {
      throw new Error(error.message);
    }

    return await signThumbnails<Event>(
      (data ?? [])
        .filter((row: any) => !row.decided)
        .map((row: any) => toEvent({ ...row, viewer_id: viewerId }))
    );
  } catch (error: any) {
    console.error("Error fetching live bets:", error.message);
    return [];
  }
};
