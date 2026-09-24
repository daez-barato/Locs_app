export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          option_id: number
          payout: number | null
          question_id: number
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_id: string
          option_id: number
          payout?: number | null
          question_id: number
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          option_id?: number
          payout?: number | null
          question_id?: number
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          event_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_winning_options: {
        Row: {
          created_at: string
          event_id: string
          option_id: number
          question_id: number
        }
        Insert: {
          created_at?: string
          event_id: string
          option_id: number
          question_id: number
        }
        Update: {
          created_at?: string
          event_id?: string
          option_id?: number
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_winning_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          creator_id: string
          decided: boolean
          expire_date: string
          id: string
          locked: boolean
          public: boolean
          template_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          decided?: boolean
          expire_date: string
          id?: string
          locked?: boolean
          public?: boolean
          template_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          decided?: boolean
          expire_date?: string
          id?: string
          locked?: boolean
          public?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_requests: {
        Row: {
          created_at: string
          requester_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          requester_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          requester_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          id: number
          question_id: number
          template_id: string
          title: string
        }
        Insert: {
          id: number
          question_id: number
          template_id: string
          title: string
        }
        Update: {
          id?: number
          question_id?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_template_id_question_id_fkey"
            columns: ["template_id", "question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["template_id", "id"]
          },
        ]
      }
      questions: {
        Row: {
          id: number
          template_id: string
          title: string
        }
        Insert: {
          id: number
          template_id: string
          title: string
        }
        Update: {
          id?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_templates: {
        Row: {
          template_id: string
          user_id: string
        }
        Insert: {
          template_id: string
          user_id: string
        }
        Update: {
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_path: string
          kind: string
          name: string
          price: number
          rarity: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          image_path: string
          kind: string
          name: string
          price: number
          rarity?: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_path?: string
          kind?: string
          name?: string
          price?: number
          rarity?: string
          sort_order?: number
        }
        Relationships: []
      }
      template_likes: {
        Row: {
          template_id: string
          user_id: string
        }
        Insert: {
          template_id: string
          user_id: string
        }
        Update: {
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_likes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          public: boolean | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          public?: boolean | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          public?: boolean | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          acquired_at: string
          item_id: string
          price_paid: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          item_id: string
          price_paid: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          item_id?: string
          price_paid?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          id: string
          public: boolean
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          id: string
          public?: boolean
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          id?: string
          public?: boolean
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_follow_request: {
        Args: { _requester_id: string }
        Returns: undefined
      }
      add_bet: {
        Args: {
          _amount: number
          _event_id: string
          _option_id: number
          _question_id: number
        }
        Returns: undefined
      }
      assert_valid_expire_date: {
        Args: { _expire_date: string }
        Returns: undefined
      }
      create_event: {
        Args: { _payload: Json }
        Returns: {
          event_id: string
          template_id: string
        }[]
      }
      create_event_from_template: {
        Args: { _payload: Json }
        Returns: {
          event_id: string
          template_id: string
        }[]
      }
      create_event_with_template: {
        Args: {
          _creator_id: string
          _event_decided?: boolean
          _event_expire_date?: string
          _event_locked?: boolean
          _public?: boolean
          _template_description?: string
          _template_thumbnail_url?: string
          _template_title: string
        }
        Returns: {
          event_id: string
          template_id: string
        }[]
      }
      daily_set_minimum_coins: { Args: never; Returns: undefined }
      decide_event: {
        Args: { _event_id: string; _winners: Json }
        Returns: undefined
      }
      delete_event: {
        Args: { _event_id: string }
        Returns: {
          refunded_coins: number
          refunded_users: number
        }[]
      }
      distribute_event_payouts: {
        Args: { _event_id: string }
        Returns: undefined
      }
      equip_item: {
        Args: { _item_id: string }
        Returns: {
          avatar_url: string
        }[]
      }
      follow_user: {
        Args: { _target_id: string }
        Returns: {
          status: string
        }[]
      }
      get_avatar_item: {
        Args: { _image_path: string }
        Returns: {
          active: boolean
          description: string
          item_id: string
          name: string
          price: number
          rarity: string
        }[]
      }
      get_event_bets_db: { Args: { p_event_id: string }; Returns: Json }
      get_event_information_db: { Args: { p_event_id: string }; Returns: Json }
      get_following_posts: {
        Args: { page_offset?: number }
        Returns: {
          creator_username: string
          decided: boolean
          description: string
          expire_date: string
          id: string
          is_creator: boolean
          likes: number
          locked: boolean
          participants_count: number
          thumbnail_url: string
          title: string
          total_pot: number
        }[]
      }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string
          coins: number
          created_at: string
          events: number
          follow_requests: number
          followers: number
          following: number
          has_requested: boolean
          id: string
          is_following: boolean
          owner: boolean
          participated: number
          public: boolean
          username: string
        }[]
      }
      get_saved_templates: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          creator_id: string
          description: string
          is_public: boolean
          template_id: string
          thumbnail_url: string
          title: string
        }[]
      }
      get_shop_items: {
        Args: never
        Returns: {
          description: string
          equipped: boolean
          image_path: string
          item_id: string
          kind: string
          name: string
          owned: boolean
          price: number
          rarity: string
        }[]
      }
      get_template_by_id: { Args: { p_template_id: string }; Returns: Json }
      get_user_created_events: {
        Args: { page_offset?: number; username: string }
        Returns: {
          created_at: string
          creator_id: string
          creator_username: string
          decided: boolean
          event_id: string
          expire_date: string
          is_public: boolean
          likes_count: number
          locked: boolean
          participants_count: number
          template_description: string
          template_id: string
          template_image_url: string
          template_title: string
          total_pot_amount: number
        }[]
      }
      get_user_follow_requests: {
        Args: { page_offset?: number; username: string }
        Returns: {
          avatar_url: string
          coins: number
          created_at: string
          has_requested: boolean
          id: string
          is_following: boolean
          public: boolean
          requester: boolean
          username: string
        }[]
      }
      get_user_followers: {
        Args: { page_offset?: number; username: string }
        Returns: {
          avatar_url: string
          coins: number
          created_at: string
          has_requested: boolean
          id: string
          is_following: boolean
          public: boolean
          username: string
        }[]
      }
      get_user_following: {
        Args: { page_offset?: number; username: string }
        Returns: {
          avatar_url: string
          coins: number
          created_at: string
          has_requested: boolean
          id: string
          is_following: boolean
          public: boolean
          username: string
        }[]
      }
      get_user_participated_events: {
        Args: { page_offset?: number; username: string }
        Returns: {
          created_at: string
          creator_id: string
          creator_username: string
          decided: boolean
          event_id: string
          expire_date: string
          is_public: boolean
          likes_count: number
          locked: boolean
          participants_count: number
          template_description: string
          template_id: string
          template_image_url: string
          template_title: string
          total_pot_amount: number
        }[]
      }
      get_user_profile: {
        Args: { username: string }
        Returns: {
          avatar_url: string
          coins: number
          created_at: string
          events: number
          follow_requests: number
          followers: number
          following: number
          has_requested: boolean
          id: string
          is_following: boolean
          owner: boolean
          participated: number
          public: boolean
          username: string
        }[]
      }
      lock_event: { Args: { _event_id: string }; Returns: undefined }
      publish_template: { Args: { _template_id: string }; Returns: undefined }
      purchase_item: {
        Args: { _item_id: string }
        Returns: {
          coins: number
          item_id: string
        }[]
      }
      recommended_events: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          created_at: string
          creator_id: string
          decided: boolean
          event_id: string
          expire_date: string
          is_public: boolean
          likes_count: number
          locked: boolean
          participants_count: number
          template_description: string
          template_id: string
          template_thumbnail: string
          template_title: string
          total_pot_amount: number
        }[]
      }
      refund_expired_events: { Args: never; Returns: undefined }
      reject_follow_request: {
        Args: { _requester_id: string }
        Returns: undefined
      }
      save_template: { Args: { _template_id: string }; Returns: undefined }
      search_events: {
        Args: { _limit?: number; _offset?: number; _word: string }
        Returns: {
          created_at: string
          creator_id: string
          decided: boolean
          event_id: string
          expire_date: string
          is_public: boolean
          likes_count: number
          locked: boolean
          participants_count: number
          template_description: string
          template_id: string
          template_thumbnail: string
          template_title: string
          total_pot_amount: number
        }[]
      }
      search_templates: {
        Args: { _limit?: number; _offset?: number; _word: string }
        Returns: {
          bookmarks_count: number
          creator_id: string
          creator_username: string
          description: string
          is_public: boolean
          likes_count: number
          template_id: string
          thumbnail_url: string
          title: string
        }[]
      }
      search_users: {
        Args: { _limit?: number; _offset?: number; _word: string }
        Returns: {
          avatar_url: string
          created_at: string
          user_id: string
          username: string
        }[]
      }
      set_user_privacy: {
        Args: { _public: boolean }
        Returns: {
          public: boolean
        }[]
      }
      toggle_event_like: {
        Args: { _event_id: string }
        Returns: {
          event_id: string
          liked: boolean
        }[]
      }
      toggle_template_like: {
        Args: { _template_id: string }
        Returns: {
          liked: boolean
          template_id: string
        }[]
      }
      trending_templates: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          bookmarks_count: number
          creator_id: string
          creator_username: string
          description: string
          is_public: boolean
          likes_count: number
          template_id: string
          thumbnail_url: string
          title: string
        }[]
      }
      unfollow_user: { Args: { _target_id: string }; Returns: undefined }
      unsave_template: { Args: { _template_id: string }; Returns: undefined }
      update_avatar: {
        Args: { _avatar_url: string }
        Returns: {
          avatar_url: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
