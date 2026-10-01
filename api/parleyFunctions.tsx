import { supabase } from "@/lib/supabase";
import { Event } from "@/types/interfaces";
import { signThumbnails } from "@/utils/image-upload";
import { getViewerId } from "@/utils/viewer";
import { CreatedEventRow, ParticipatedEventRow } from "@/types/rpc";

function toEvent(
  row: (CreatedEventRow | ParticipatedEventRow) & { viewer_id?: string }
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
    is_creator: row.creator_id === row.viewer_id,
    participants_count: row.participants_count ?? 0,
    total_pot: row.total_pot_amount,
    likes_count: row.likes_count,
    public: row.is_public,
  });
}

/**
 * `username` comes from the caller (the signed-in user's own profile, already
 * held in auth context) rather than a `get_my_profile` round trip here — that
 * used to mean `auth.getUser()` -> `get_my_profile` -> this RPC in series,
 * just to look up the username this screen already has.
 */
export const fetchUserLiveEvents = async (username: string) => {
  try {
    const [viewerId, { data, error }] = await Promise.all([
      getViewerId(),
      supabase.rpc("get_user_created_events", { username }),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return await signThumbnails<Event>(
      (data ?? [])
        .filter((row) => !row.decided)
        .map((row) => toEvent({ ...row, viewer_id: viewerId }))
    );
  } catch (error: any) {
    // Returning [] made a failed request look like "you have no events".
    console.error("Error fetching live events:", error.message);
    throw new Error(error?.message || "Failed to load events");
  }
};

export const fetchUserLiveBets = async (username: string) => {
  try {
    const [viewerId, { data, error }] = await Promise.all([
      getViewerId(),
      supabase.rpc("get_user_participated_events", { username }),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return await signThumbnails<Event>(
      (data ?? [])
        .filter((row) => !row.decided)
        .map((row) => toEvent({ ...row, viewer_id: viewerId }))
    );
  } catch (error: any) {
    console.error("Error fetching live bets:", error.message);
    throw new Error(error?.message || "Failed to load bets");
  }
};
