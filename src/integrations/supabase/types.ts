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
  public: {
    Tables: {
      applications: {
        Row: {
          action_plan: Json | null
          created_at: string
          id: string
          notes: string | null
          scheme_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_plan?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          scheme_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_plan?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          scheme_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          label: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          label: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          label?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          age: number | null
          created_at: string
          disability_percentage: number | null
          disability_type: string | null
          gender: string | null
          has_disability: boolean
          id: string
          monthly_income: number | null
          name: string
          notes: string | null
          occupation: string | null
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          disability_percentage?: number | null
          disability_type?: string | null
          gender?: string | null
          has_disability?: boolean
          id?: string
          monthly_income?: number | null
          name: string
          notes?: string | null
          occupation?: string | null
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          disability_percentage?: number | null
          disability_type?: string | null
          gender?: string | null
          has_disability?: boolean
          id?: string
          monthly_income?: number | null
          name?: string
          notes?: string | null
          occupation?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_citizen_family: {
        Row: {
          age: number | null
          citizen_id: string
          created_at: string
          gender: string | null
          has_disability: boolean | null
          id: string
          is_demo: boolean
          monthly_income: number | null
          name: string
          notes: string | null
          occupation: string | null
          partner_id: string
          relationship: string
        }
        Insert: {
          age?: number | null
          citizen_id: string
          created_at?: string
          gender?: string | null
          has_disability?: boolean | null
          id?: string
          is_demo?: boolean
          monthly_income?: number | null
          name: string
          notes?: string | null
          occupation?: string | null
          partner_id: string
          relationship: string
        }
        Update: {
          age?: number | null
          citizen_id?: string
          created_at?: string
          gender?: string | null
          has_disability?: boolean | null
          id?: string
          is_demo?: boolean
          monthly_income?: number | null
          name?: string
          notes?: string | null
          occupation?: string | null
          partner_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_citizen_family_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "partner_citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_citizens: {
        Row: {
          age: number | null
          applications_completed: number
          applications_started: number
          category: string | null
          created_at: string
          district: string | null
          education: string | null
          estimated_benefits: number
          full_name: string
          gender: string | null
          has_disability: boolean | null
          household_size: number | null
          household_type: string | null
          id: string
          is_demo: boolean
          last_activity_at: string
          marital_status: string | null
          mobile: string | null
          monthly_income: number | null
          notes: string | null
          occupation: string | null
          partner_id: string
          preferred_language: string | null
          state: string | null
          status: Database["public"]["Enums"]["follow_up_status"]
          updated_at: string
        }
        Insert: {
          age?: number | null
          applications_completed?: number
          applications_started?: number
          category?: string | null
          created_at?: string
          district?: string | null
          education?: string | null
          estimated_benefits?: number
          full_name: string
          gender?: string | null
          has_disability?: boolean | null
          household_size?: number | null
          household_type?: string | null
          id?: string
          is_demo?: boolean
          last_activity_at?: string
          marital_status?: string | null
          mobile?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          partner_id: string
          preferred_language?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
        }
        Update: {
          age?: number | null
          applications_completed?: number
          applications_started?: number
          category?: string | null
          created_at?: string
          district?: string | null
          education?: string | null
          estimated_benefits?: number
          full_name?: string
          gender?: string | null
          has_disability?: boolean | null
          household_size?: number | null
          household_type?: string | null
          id?: string
          is_demo?: boolean
          last_activity_at?: string
          marital_status?: string | null
          mobile?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          partner_id?: string
          preferred_language?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          category: string | null
          created_at: string
          disability_percentage: number | null
          disability_type: string | null
          district: string | null
          education: string | null
          full_name: string | null
          gender: string | null
          has_disability: boolean
          high_contrast: boolean
          household_size: number | null
          household_type: string | null
          id: string
          is_demo: boolean
          journey: string | null
          large_text: boolean
          marital_status: string | null
          monthly_income: number | null
          occupation: string | null
          onboarding_done: boolean
          preferred_language: string
          profile_completeness: number
          state: string | null
          updated_at: string
          voice_first: boolean
        }
        Insert: {
          age?: number | null
          category?: string | null
          created_at?: string
          disability_percentage?: number | null
          disability_type?: string | null
          district?: string | null
          education?: string | null
          full_name?: string | null
          gender?: string | null
          has_disability?: boolean
          high_contrast?: boolean
          household_size?: number | null
          household_type?: string | null
          id: string
          is_demo?: boolean
          journey?: string | null
          large_text?: boolean
          marital_status?: string | null
          monthly_income?: number | null
          occupation?: string | null
          onboarding_done?: boolean
          preferred_language?: string
          profile_completeness?: number
          state?: string | null
          updated_at?: string
          voice_first?: boolean
        }
        Update: {
          age?: number | null
          category?: string | null
          created_at?: string
          disability_percentage?: number | null
          disability_type?: string | null
          district?: string | null
          education?: string | null
          full_name?: string | null
          gender?: string | null
          has_disability?: boolean
          high_contrast?: boolean
          household_size?: number | null
          household_type?: string | null
          id?: string
          is_demo?: boolean
          journey?: string | null
          large_text?: boolean
          marital_status?: string | null
          monthly_income?: number | null
          occupation?: string | null
          onboarding_done?: boolean
          preferred_language?: string
          profile_completeness?: number
          state?: string | null
          updated_at?: string
          voice_first?: boolean
        }
        Relationships: []
      }
      saved_schemes: {
        Row: {
          created_at: string
          id: string
          scheme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scheme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scheme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_schemes_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          benefits: Json
          category: string
          eligibility: Json
          id: string
          level: string
          ministry: string | null
          name: string
          next_step: string
          official_url: string
          required_documents: Json
          short_name: string | null
          state: string | null
          summary: string
          tags: string[]
          trust_note: string | null
          updated_at: string
        }
        Insert: {
          benefits?: Json
          category: string
          eligibility?: Json
          id: string
          level?: string
          ministry?: string | null
          name: string
          next_step: string
          official_url: string
          required_documents?: Json
          short_name?: string | null
          state?: string | null
          summary: string
          tags?: string[]
          trust_note?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: Json
          category?: string
          eligibility?: Json
          id?: string
          level?: string
          ministry?: string | null
          name?: string
          next_step?: string
          official_url?: string
          required_documents?: Json
          short_name?: string | null
          state?: string | null
          summary?: string
          tags?: string[]
          trust_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "citizen" | "partner" | "admin"
      follow_up_status:
        | "need_documents"
        | "application_submitted"
        | "waiting_approval"
        | "benefit_received"
        | "completed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["citizen", "partner", "admin"],
      follow_up_status: [
        "need_documents",
        "application_submitted",
        "waiting_approval",
        "benefit_received",
        "completed",
      ],
    },
  },
} as const
