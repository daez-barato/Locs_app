import { supabase } from "@/lib/supabase";
import { EventDto, TemplateDto } from "@/types/dtos";
import { Event } from "@/types/interfaces";

export async function fetchFollowingPosts(offset: number): Promise<Event[]> {

    try {
        const { data, error } = await supabase.rpc('get_following_posts', {
            page_offset: offset
        });

        if (error) {
            throw new Error(error.message);
        }

        const events: Event[] = data.map((event: any) => Event(event));

        return events;
    } catch (err) {
        console.error('Error fetching following posts:', err);
        return [];
    }
}

async function uploadTemplateThumbnail(uri: string, userId: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = blob.type?.split("/")[1] || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("event-thumbnail")
    .upload(path, blob, { contentType: blob.type || "image/jpeg" });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export const postEvent = async (eventDto: EventDto, templateDto: TemplateDto): Promise<string | undefined> => {
  try {
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth.user?.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const expireDate = new Date(Date.now() + eventDto.durationMinutes * 60_000).toISOString();
    const isPublic = eventDto.privacy === "Public";

    if (!eventDto.templateId) {
      // The studio UI keeps a trailing blank option input per question; drop it before saving.
      const options: Record<string, string[]> = JSON.parse(JSON.stringify(templateDto.optionsDict));
      for (const key in options) {
        options[key].pop();
      }

      let thumbnailPath: string | undefined;
      if (templateDto.image) {
        thumbnailPath = await uploadTemplateThumbnail(templateDto.image, userId);
      }

      const questions = Object.entries(options).map(([title, opts], qIdx) => ({
        id: qIdx + 1,
        title,
        options: opts.map((optionTitle, oIdx) => ({
          id: oIdx + 1,
          title: optionTitle,
        })),
      }));

      const { data, error } = await supabase.rpc("create_event", {
        _payload: {
          template_title: templateDto.title,
          template_description: templateDto.description,
          template_thumbnail_url: thumbnailPath,
          event_expire_date: expireDate,
          event_public: isPublic,
          questions,
        },
      });

      if (error || !data || data.length === 0) {
        throw new Error(error ? error.message : "No event ID returned");
      }

      return data[0].event_id;
    }

    const { data, error } = await supabase.rpc("create_event_from_template", {
      _payload: {
        template_id: eventDto.templateId,
        event_expire_date: expireDate,
        event_public: isPublic,
      },
    });

    if (error || !data || data.length === 0) {
      throw new Error(error ? error.message : "No event ID returned");
    }

    return data[0].event_id;
  } catch (err) {
    console.error("Error creating event:", err);
    return undefined;
  }
};
