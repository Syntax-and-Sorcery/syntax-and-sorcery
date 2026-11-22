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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      adventure_runs: {
        Row: {
          adventure_id: string
          completed_at: string | null
          id: string
          messages: Json
          started_at: string
          status: string
          story_summary: string | null
          user_id: string
        }
        Insert: {
          adventure_id: string
          completed_at?: string | null
          id?: string
          messages?: Json
          started_at?: string
          status?: string
          story_summary?: string | null
          user_id?: string
        }
        Update: {
          adventure_id?: string
          completed_at?: string | null
          id?: string
          messages?: Json
          started_at?: string
          status?: string
          story_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adventure_runs_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adventure_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      adventures: {
        Row: {
          concepts: Json
          id: string
          slug: string
          sort_order: number
          summary: string
          title: string
          track_id: string
        }
        Insert: {
          concepts?: Json
          id?: string
          slug: string
          sort_order: number
          summary?: string
          title: string
          track_id: string
        }
        Update: {
          concepts?: Json
          id?: string
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adventures_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          ai_requests: number
          day: string
          sandbox_runs: number
          user_id: string
        }
        Insert: {
          ai_requests?: number
          day?: string
          sandbox_runs?: number
          user_id: string
        }
        Update: {
          ai_requests?: number
          day?: string
          sandbox_runs?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answer: string
          created_at: string
          encounter_id: string
          id: string
          passed: boolean
          result: Json
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          encounter_id: string
          id?: string
          passed: boolean
          result?: Json
          user_id?: string
        }
        Update: {
          answer?: string
          created_at?: string
          encounter_id?: string
          id?: string
          passed?: boolean
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          basic_hints: number
          created_at: string
          ended_at: string | null
          enemy_color: string
          enemy_name: string
          enemy_sprite: string
          id: string
          is_boss: boolean
          puzzle_id: string
          run_id: string
          status: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          basic_hints?: number
          created_at?: string
          ended_at?: string | null
          enemy_color: string
          enemy_name: string
          enemy_sprite: string
          id?: string
          is_boss?: boolean
          puzzle_id: string
          run_id: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Update: {
          basic_hints?: number
          created_at?: string
          ended_at?: string | null
          enemy_color?: string
          enemy_name?: string
          enemy_sprite?: string
          id?: string
          is_boss?: boolean
          puzzle_id?: string
          run_id?: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "encounters_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "adventure_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          details: Json
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          item_slug: string
          quantity: number
          user_id: string
        }
        Insert: {
          item_slug: string
          quantity?: number
          user_id?: string
        }
        Update: {
          item_slug?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          preferences?: Json
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          role?: string
          username?: string
        }
        Relationships: []
      }
      puzzles: {
        Row: {
          adventure_id: string
          answer: Json
          concept: string
          content: Json
          created_at: string
          description: string
          difficulty: number
          generation_log: Json | null
          id: string
          kind: string
          status: string
          theme: string
          title: string
        }
        Insert: {
          adventure_id: string
          answer: Json
          concept: string
          content: Json
          created_at?: string
          description: string
          difficulty: number
          generation_log?: Json | null
          id?: string
          kind: string
          status?: string
          theme?: string
          title: string
        }
        Update: {
          adventure_id?: string
          answer?: Json
          concept?: string
          content?: Json
          created_at?: string
          description?: string
          difficulty?: number
          generation_log?: Json | null
          id?: string
          kind?: string
          status?: string
          theme?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "puzzles_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      track_progress: {
        Row: {
          track_id: string
          user_id: string
          xp: number
        }
        Insert: {
          track_id: string
          user_id?: string
          xp?: number
        }
        Update: {
          track_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "track_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          description: string
          id: string
          language: string
          slug: string
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          description?: string
          id?: string
          language: string
          slug: string
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          description?: string
          id?: string
          language?: string
          slug?: string
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_usage: {
        Args: { p_kind: string; p_limit: number; p_user: string }
        Returns: boolean
      }
      flag_puzzle: { Args: { p_puzzle_id: string }; Returns: boolean }
      settle_encounter: {
        Args: {
          p_answer: string
          p_encounter_id: string
          p_items: string[]
          p_result: Json
          p_xp: number
        }
        Returns: boolean
      }
      username_available: { Args: { p_username: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
