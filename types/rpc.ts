// Contracts for the RPCs that return jsonb.
//
// supabase gen types can only describe these as `Json`, because a jsonb return
// has no schema for Postgres to introspect — so these are the one place where
// the shape is asserted by hand. Keep them in step with the SQL definitions in
// locs_server/supabase/migrations; everything else is generated.

export type RpcQuestion = {
  question_id: number;
  options: { option_id: number; title: string }[];
};

/** get_event_information_db */
export type EventInformationPayload = {
  expire_date: string;
  locked: boolean;
  decided: boolean;
  public: boolean;

  event_creator_id: string;
  event_creator: string;
  avatar_url: string | null;

  /** storage path in the private event-thumbnail bucket, not a URL */
  image_url: string | null;

  template_id: string;
  title: string;
  description: string | null;
  template_creator_id: string;

  is_following: boolean;
  has_requested: boolean;
  template_saved: boolean;
  template_posted: boolean | null;

  questions: Record<string, RpcQuestion>;
};

/** get_event_bets_db */
export type EventBetPayload = {
  user_id: string;
  username: string;
  question: string;
  option: string;
  amount: number;
  payout: number | null;
};

/** get_template_by_id */
export type TemplatePayload = {
  template_id: string;
  title: string;
  description: string | null;
  /** storage path in the private event-thumbnail bucket, not a URL */
  thumbnail_url: string | null;
  creator_id: string;
  is_public: boolean | null;
  questions: Record<string, RpcQuestion>;
};

/**
 * What eventInformation() hands the event screen: the RPC payload with the
 * creator nested, the thumbnail signed, and questions flattened to titles.
 * Replaces the stale ExpandedEvent interface, which declared fields
 * (bets, user_bets, creator_username) this RPC has never returned.
 */
export type EventDetails = Omit<EventInformationPayload, "questions"> & {
  questions: Record<string, string[]>;
  thumbnail_url: string | null;
  is_creator: boolean;
  creator: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_following: boolean;
    has_requested: boolean;
  };
};

// Row types for the table-returning RPCs, pulled straight from the generated
// schema. Mapping functions should take these rather than `any`, otherwise a
// misread column name (row.id when the RPC returns event_id) compiles fine and
// fails on device.
import { Database } from "./database.types";

type Fn = Database["public"]["Functions"];
export type RpcRow<K extends keyof Fn> = Fn[K]["Returns"] extends readonly (infer R)[]
  ? R
  : never;

export type CreatedEventRow = RpcRow<"get_user_created_events">;
export type ParticipatedEventRow = RpcRow<"get_user_participated_events">;
export type RecommendedEventRow = RpcRow<"recommended_events">;
export type SearchEventRow = RpcRow<"search_events">;
export type SearchTemplateRow = RpcRow<"search_templates">;
export type TrendingTemplateRow = RpcRow<"trending_templates">;
export type SearchUserRow = RpcRow<"search_users">;
export type SavedTemplateRow = RpcRow<"get_saved_templates">;
