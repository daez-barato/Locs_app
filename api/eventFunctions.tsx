import { supabase } from "@/lib/supabase";
import { EventBetPayload, EventDetails, EventInformationPayload, RpcQuestion } from "@/types/rpc";

type QuestionIdMap = Record<string, { questionId: number; options: Record<string, number> }>;

// get_event_information_db returns question_id/option_id alongside titles so bets can be
// placed by id (add_bet/decide_event require ids), but the event screen renders by title.
// Cache the id lookup per event here instead of reshaping the screen's title-keyed state.
const eventQuestionMaps = new Map<string, QuestionIdMap>();

function splitQuestionsPayload(
  raw: Record<string, RpcQuestion> | undefined
): { flat: Record<string, string[]>; map: QuestionIdMap } {
  const flat: Record<string, string[]> = {};
  const map: QuestionIdMap = {};

  for (const [title, question] of Object.entries(raw || {})) {
    flat[title] = question.options.map((o) => o.title);
    map[title] = {
      questionId: question.question_id,
      options: Object.fromEntries(question.options.map((o) => [o.title, o.option_id])),
    };
  }

  return { flat, map };
}

export const eventInformation = async (
  eventId: string
): Promise<EventDetails | { error: true; msg: string }> => {
  try {
    const { data, error } = await supabase.rpc("get_event_information_db", { p_event_id: eventId });

    if (error || !data) {
      throw new Error(error?.message || "Event not found");
    }

    // jsonb returns arrive as Json; assert the documented shape once, here.
    const event = data as unknown as EventInformationPayload;

    const { flat, map } = splitQuestionsPayload(event.questions);
    eventQuestionMaps.set(eventId, map);

    const { data: userAuth } = await supabase.auth.getUser();
    const viewerId = userAuth.user?.id;

    // The RPC returns the creator as flat fields and the thumbnail as a storage
    // path in a private bucket. The screen wants a nested creator and a URL it
    // can render, so shape it here rather than in every consumer.
    let thumbnailUrl: string | null = null;
    if (event.image_url) {
      const { data: signed } = await supabase.storage
        .from("event-thumbnail")
        .createSignedUrl(event.image_url, 60 * 60);
      thumbnailUrl = signed?.signedUrl ?? null;
    }

    return {
      ...event,
      questions: flat,
      thumbnail_url: thumbnailUrl,
      is_creator: !!viewerId && event.event_creator_id === viewerId,
      creator: {
        id: event.event_creator_id,
        username: event.event_creator,
        avatar_url: event.avatar_url,
        is_following: event.is_following,
        has_requested: event.has_requested,
      },
    };
  } catch (err: any) {
    console.error("Error fetching event information:", err);
    return { error: true as const, msg: err.message };
  }
};

export const fetchEventBets = async (eventId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_event_bets_db", { p_event_id: eventId });

    if (error) {
      throw new Error(error.message);
    }

    // Returns null when the caller isn't authenticated; the screen iterates
    // this directly, so never hand back a non-array.
    return (data ?? []) as unknown as EventBetPayload[];
  } catch (err: any) {
    console.error("Error fetching event bets:", err);
    return { error: true as const, msg: err.message };
  }
};

export const placeBet = async (eventId: string, question: string, option: string, amount: number) => {
  try {
    const ids = eventQuestionMaps.get(eventId)?.[question];
    const optionId = ids?.options[option];

    if (ids === undefined || optionId === undefined) {
      throw new Error("Unknown question or option — pull to refresh and try again");
    }

    const { error } = await supabase.rpc("add_bet", {
      _event_id: eventId,
      _question_id: ids.questionId,
      _option_id: optionId,
      _amount: amount,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error placing bet:", err);
    return { error: true as const, msg: err.message };
  }
};

export const lockEvent = async (eventId: string) => {
  try {
    const { error } = await supabase.rpc("lock_event", { _event_id: eventId });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error locking event:", err);
    return { error: true as const, msg: err.message };
  }
};

export const endEvent = async (eventId: string, winningOptions: Record<string, string>) => {
  try {
    const map = eventQuestionMaps.get(eventId);

    if (!map) {
      throw new Error("Event data not loaded — pull to refresh and try again");
    }

    const winners = Object.entries(winningOptions).map(([question, option]) => {
      const ids = map[question];
      const optionId = ids?.options[option];

      if (ids === undefined || optionId === undefined) {
        throw new Error(`Unknown question or option: ${question} / ${option}`);
      }

      return { question_id: ids.questionId, option_id: optionId };
    });

    const { error } = await supabase.rpc("decide_event", { _event_id: eventId, _winners: winners });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error ending event:", err);
    return { error: true as const, msg: err.message };
  }
};

export const setEventPublic = async (eventId: string, isPublic: boolean) => {
  try {
    const { data, error } = await supabase.rpc("set_event_public", {
      _event_id: eventId,
      _public: isPublic,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, public: data as boolean };
  } catch (err: any) {
    console.error("Error updating event visibility:", err);
    return { error: true as const, msg: err.message };
  }
};

export const getEventWinners = async (eventId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_event_winners", { p_event_id: eventId });

    if (error) {
      throw new Error(error.message);
    }

    // Empty for undecided events; the screen only calls this once decided.
    return (data ?? []) as { question: string; option: string }[];
  } catch (err: any) {
    console.error("Error fetching event winners:", err);
    return { error: true as const, msg: err.message };
  }
};

export const saveTemplate = async (templateId: string) => {
  try {
    const { error } = await supabase.rpc("save_template", { _template_id: templateId });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving template:", err);
    return { error: true as const, msg: err.message };
  }
};

export const postTemplate = async (templateId: string) => {
  try {
    const { error } = await supabase.rpc("publish_template", { _template_id: templateId });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error posting template:", err);
    return { error: true as const, msg: err.message };
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const { data, error } = await supabase.rpc("delete_event", { _event_id: eventId });

    if (error) {
      throw new Error(error.message);
    }

    const result = data?.[0];
    return {
      success: true,
      refundedUsers: result?.refunded_users ?? 0,
      refundedCoins: result?.refunded_coins ?? 0,
    };
  } catch (err: any) {
    console.error("Error deleting event:", err);
    return { error: true as const, msg: err.message };
  }
};
