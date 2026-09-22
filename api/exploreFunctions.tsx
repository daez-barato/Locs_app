import { supabase } from "@/lib/supabase";
import { signThumbnails } from "@/utils/image-upload";

function eventRowToSearchEvent(row: any, viewerId: string | undefined) {
  return {
    id: row.event_id,
    template_id: row.template_id,
    title: row.template_title,
    description: row.template_description ?? "",
    expire_date: row.expire_date,
    thumbnail_url: row.template_thumbnail,
    locked: row.locked,
    decided: row.decided,
    is_creator: row.creator_id === viewerId,
    participants_count: row.participants_count ?? 0,
    total_pot: row.total_pot_amount,
    likes_count: row.likes_count,
    public: row.is_public,
    type: "event",
  };
}

function templateRowToSearchTemplate(row: any) {
  return {
    id: row.template_id,
    title: row.title,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    creator_username: row.creator_username,
    type: "template",
  };
}

// TemplateCard renders `thumbnail`; signThumbnails works off `thumbnail_url`.
async function signTemplates(rows: any[]) {
  const signed = await signThumbnails<any>(rows);
  return signed.map((r: any) => ({ ...r, thumbnail: r.thumbnail_url }));
}

function userRowToSearchUser(row: any) {
  return {
    id: row.user_id,
    username: row.username,
    avatar_url: row.avatar_url,
    type: "user",
  };
}

export const fetchTrending = async (eventOffset: number = 0, templateOffset: number = 0) => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const viewerId = userAuth.user?.id;

    const [eventsRes, templatesRes] = await Promise.all([
      supabase.rpc("recommended_events", { _offset: eventOffset }),
      supabase.rpc("trending_templates", { _offset: templateOffset }),
    ]);

    if (eventsRes.error) throw new Error(eventsRes.error.message);
    if (templatesRes.error) throw new Error(templatesRes.error.message);

    return {
      events: await signThumbnails<any>((eventsRes.data ?? []).map((row: any) => eventRowToSearchEvent(row, viewerId))),
      templates: await signTemplates((templatesRes.data ?? []).map(templateRowToSearchTemplate)),
      error: undefined as string | undefined,
    };
  } catch (error: any) {
    console.error("Error fetching trending events:", error.message);
    return { events: [] as any[], templates: [] as any[], error: error.message as string | undefined };
  }
};

export const search = async (query: string, eventOffset: number = 0, templateOffset: number = 0, userOffset: number = 0) => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const viewerId = userAuth.user?.id;

    const [eventsRes, templatesRes, usersRes] = await Promise.all([
      supabase.rpc("search_events", { _word: query, _offset: eventOffset }),
      supabase.rpc("search_templates", { _word: query, _offset: templateOffset }),
      supabase.rpc("search_users", { _word: query, _offset: userOffset }),
    ]);

    if (eventsRes.error) throw new Error(eventsRes.error.message);
    if (templatesRes.error) throw new Error(templatesRes.error.message);
    if (usersRes.error) throw new Error(usersRes.error.message);

    return {
      events: await signThumbnails<any>((eventsRes.data ?? []).map((row: any) => eventRowToSearchEvent(row, viewerId))),
      templates: await signTemplates((templatesRes.data ?? []).map(templateRowToSearchTemplate)),
      users: (usersRes.data ?? []).map(userRowToSearchUser),
      error: undefined as string | undefined,
    };
  } catch (error: any) {
    console.error("Error fetching search results:", error.message);
    return { events: [] as any[], templates: [] as any[], users: [] as any[], error: error.message as string | undefined };
  }
};
