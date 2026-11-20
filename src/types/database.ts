export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
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
      active_timer: {
        Row: {
          break_min: number
          mode: Database['public']['Enums']['timer_mode']
          paused_at: string | null
          paused_seconds: number
          project_phase_id: string | null
          started_at: string
          topic_id: string | null
          updated_at: string
          user_id: string
          work_min: number
        }
        ComputedFields: never
        Insert: {
          break_min: number
          mode: Database['public']['Enums']['timer_mode']
          paused_at?: string | null
          paused_seconds?: number
          project_phase_id?: string | null
          started_at: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          work_min: number
        }
        Update: {
          break_min?: number
          mode?: Database['public']['Enums']['timer_mode']
          paused_at?: string | null
          paused_seconds?: number
          project_phase_id?: string | null
          started_at?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          work_min?: number
        }
        Relationships: [
          {
            foreignKeyName: 'active_timer_project_phase_id_fkey'
            columns: ['project_phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'active_timer_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      checklist_items: {
        Row: {
          id: string
          sort_order: number
          text: string
        }
        ComputedFields: never
        Insert: {
          id: string
          sort_order: number
          text: string
        }
        Update: {
          id?: string
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      checklist_progress: {
        Row: {
          done: boolean
          done_at: string | null
          item_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          done?: boolean
          done_at?: string | null
          item_id: string
          user_id?: string
        }
        Update: {
          done?: boolean
          done_at?: string | null
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_progress_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'checklist_items'
            referencedColumns: ['id']
          },
        ]
      }
      curriculum_meta: {
        Row: {
          goal: string
          id: number
          title: string
          version: number
        }
        ComputedFields: never
        Insert: {
          goal: string
          id?: number
          title: string
          version: number
        }
        Update: {
          goal?: string
          id?: number
          title?: string
          version?: number
        }
        Relationships: []
      }
      phases: {
        Row: {
          estimated_weeks: number
          id: string
          project_description: string
          project_title: string
          sort_order: number
          summary: string
          title: string
        }
        ComputedFields: never
        Insert: {
          estimated_weeks: number
          id: string
          project_description?: string
          project_title: string
          sort_order: number
          summary?: string
          title: string
        }
        Update: {
          estimated_weeks?: number
          id?: string
          project_description?: string
          project_title?: string
          sort_order?: number
          summary?: string
          title?: string
        }
        Relationships: []
      }
      project_progress: {
        Row: {
          completed_at: string | null
          demo_url: string | null
          notes: string
          phase_id: string
          repo_url: string | null
          status: Database['public']['Enums']['progress_status']
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          demo_url?: string | null
          notes?: string
          phase_id: string
          repo_url?: string | null
          status?: Database['public']['Enums']['progress_status']
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          demo_url?: string | null
          notes?: string
          phase_id?: string
          repo_url?: string | null
          status?: Database['public']['Enums']['progress_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_progress_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string
          id: string
          mode: Database['public']['Enums']['study_mode']
          notes: string
          project_phase_id: string | null
          started_at: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          duration_minutes: number
          ended_at: string
          id?: string
          mode: Database['public']['Enums']['study_mode']
          notes?: string
          project_phase_id?: string | null
          started_at: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string
          id?: string
          mode?: Database['public']['Enums']['study_mode']
          notes?: string
          project_phase_id?: string | null
          started_at?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_sessions_project_phase_id_fkey'
            columns: ['project_phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_sessions_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      topic_progress: {
        Row: {
          completed_at: string | null
          notes: string
          status: Database['public']['Enums']['progress_status']
          topic_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          notes?: string
          status?: Database['public']['Enums']['progress_status']
          topic_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          notes?: string
          status?: Database['public']['Enums']['progress_status']
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'topic_progress_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      topics: {
        Row: {
          details: string
          id: string
          phase_id: string
          sort_order: number
          title: string
        }
        ComputedFields: never
        Insert: {
          details?: string
          id: string
          phase_id: string
          sort_order: number
          title: string
        }
        Update: {
          details?: string
          id?: string
          phase_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'topics_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
        ]
      }
      tutor_conversations: {
        Row: {
          created_at: string
          id: string
          mode: Database['public']['Enums']['tutor_mode']
          phase_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          mode: Database['public']['Enums']['tutor_mode']
          phase_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: Database['public']['Enums']['tutor_mode']
          phase_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tutor_conversations_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tutor_conversations_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      tutor_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          role: Database['public']['Enums']['message_role']
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          role: Database['public']['Enums']['message_role']
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: Database['public']['Enums']['message_role']
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tutor_messages_conversation_id_user_id_fkey'
            columns: ['conversation_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tutor_conversations'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      user_settings: {
        Row: {
          pomodoro_break_min: number
          pomodoro_work_min: number
          streak_min_minutes: number
          theme: Database['public']['Enums']['theme_preference']
          updated_at: string
          user_id: string
          weekly_goal_minutes: number
        }
        ComputedFields: never
        Insert: {
          pomodoro_break_min?: number
          pomodoro_work_min?: number
          streak_min_minutes?: number
          theme?: Database['public']['Enums']['theme_preference']
          updated_at?: string
          user_id?: string
          weekly_goal_minutes?: number
        }
        Update: {
          pomodoro_break_min?: number
          pomodoro_work_min?: number
          streak_min_minutes?: number
          theme?: Database['public']['Enums']['theme_preference']
          updated_at?: string
          user_id?: string
          weekly_goal_minutes?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finish_active_timer: {
        Args: {
          p_duration_minutes: number
          p_ended_at: string
          p_mark_done?: boolean
          p_notes?: string
        }
        Returns: string
      }
      record_study_session: {
        Args: {
          p_duration_minutes: number
          p_ended_at: string
          p_mark_done?: boolean
          p_mode: Database['public']['Enums']['study_mode']
          p_notes?: string
          p_project_phase_id?: string
          p_started_at: string
          p_topic_id?: string
        }
        Returns: string
      }
      study_day_totals: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          day: string
          minutes: number
          sessions: number
        }[]
      }
      study_phase_totals: {
        Args: Record<PropertyKey, never>
        Returns: {
          minutes: number
          phase_id: string
          sessions: number
        }[]
      }
      study_week_totals: {
        Args: { p_from?: string }
        Returns: {
          minutes: number
          sessions: number
          week_start: string
        }[]
      }
    }
    Enums: {
      message_role: 'user' | 'assistant'
      progress_status: 'pendiente' | 'en_curso' | 'hecho'
      study_mode: 'pomodoro' | 'free' | 'manual'
      theme_preference: 'system' | 'light' | 'dark'
      timer_mode: 'pomodoro' | 'free'
      tutor_mode: 'explain' | 'quiz' | 'project_review' | 'daily_plan'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      message_role: ['user', 'assistant'],
      progress_status: ['pendiente', 'en_curso', 'hecho'],
      study_mode: ['pomodoro', 'free', 'manual'],
      theme_preference: ['system', 'light', 'dark'],
      timer_mode: ['pomodoro', 'free'],
      tutor_mode: ['explain', 'quiz', 'project_review', 'daily_plan'],
    },
  },
} as const
