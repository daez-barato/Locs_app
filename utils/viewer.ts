import { supabase } from "@/lib/supabase";

/**
 * The signed-in user's id, read from the locally stored session.
 *
 * `auth.getUser()` asks the auth server — a full network round trip that every
 * list fetch used to wait on, in series, just to mark "your event" on cards.
 * The id is only used for display; access is enforced by the RPCs themselves,
 * so the local session is enough.
 */
export async function getViewerId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}
