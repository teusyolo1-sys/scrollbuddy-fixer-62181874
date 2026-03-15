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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agency_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          notes: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_revenue_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      agency_revenues: {
        Row: {
          amount: number
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          notes: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_revenues_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "agency_revenue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_revenues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          activated_at: string | null
          active_ip: string | null
          api_key: string
          created_at: string
          email: string
          expires_at: string | null
          hostinger_synced: boolean
          id: string
          is_active: boolean
          max_devices: number
          note: string | null
          payment_status: string
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          active_ip?: string | null
          api_key: string
          created_at?: string
          email: string
          expires_at?: string | null
          hostinger_synced?: boolean
          id?: string
          is_active?: boolean
          max_devices?: number
          note?: string | null
          payment_status?: string
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          active_ip?: string | null
          api_key?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          hostinger_synced?: boolean
          id?: string
          is_active?: boolean
          max_devices?: number
          note?: string | null
          payment_status?: string
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_entries: {
        Row: {
          agency_fee: number
          agency_fee_type: string
          amount: number
          category: string
          company_id: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          notes: string
          updated_at: string
        }
        Insert: {
          agency_fee?: number
          agency_fee_type?: string
          amount?: number
          category: string
          company_id?: string | null
          created_at?: string
          created_by: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          agency_fee?: number
          agency_fee_type?: string
          amount?: number
          category?: string
          company_id?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entry_participants: {
        Row: {
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entry_participants_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "budget_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_metrics: {
        Row: {
          company_id: string
          created_at: string
          date: string
          id: string
          metric_type: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          date?: string
          id?: string
          metric_type: string
          notes?: string | null
          user_id: string
          value?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          id?: string
          metric_type?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          banner_url: string | null
          color: string
          company_data: Json
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          month: string
          name: string
          subtitle: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          color?: string
          company_data?: Json
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          month?: string
          name?: string
          subtitle?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          color?: string
          company_data?: Json
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          month?: string
          name?: string
          subtitle?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_permissions: {
        Row: {
          company_id: string
          created_at: string
          granted: boolean
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number
          note: string | null
          use_count: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          team_role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          team_role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          team_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          created_at: string
          html_content: string
          id: string
          label: string | null
          project_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          label?: string | null
          project_id: string
          user_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          label?: string | null
          project_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          html_content: string | null
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          zip_file_path: string | null
        }
        Insert: {
          created_at?: string
          html_content?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          zip_file_path?: string | null
        }
        Update: {
          created_at?: string
          html_content?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          zip_file_path?: string | null
        }
        Relationships: []
      }
      section_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          html_content: string
          id: string
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          html_content: string
          id?: string
          name: string
          thumbnail_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      tab_permissions: {
        Row: {
          created_at: string
          granted: boolean
          granted_by: string | null
          id: string
          tab_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          tab_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          tab_key?: string
          user_id?: string
        }
        Relationships: []
      }
      tab_section_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          granted_by: string | null
          id: string
          section_key: string
          tab_key: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          section_key: string
          tab_key: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          section_key?: string
          tab_key?: string
          user_id?: string
        }
        Relationships: []
      }
      task_complaints: {
        Row: {
          assigned_to: string
          category: string
          created_at: string
          description: string
          id: string
          reporter_id: string
          role_name: string
          task_id: string
          task_name: string
        }
        Insert: {
          assigned_to: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          reporter_id: string
          role_name?: string
          task_id: string
          task_name: string
        }
        Update: {
          assigned_to?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          reporter_id?: string
          role_name?: string
          task_id?: string
          task_name?: string
        }
        Relationships: []
      }
      team_activities: {
        Row: {
          activity_type: string
          created_at: string
          date: string
          id: string
          member_name: string
          notes: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          date?: string
          id?: string
          member_name: string
          notes?: string | null
          unit?: string
          user_id: string
          value?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          date?: string
          id?: string
          member_name?: string
          notes?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      trial_sessions: {
        Row: {
          expired: boolean
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          expired?: boolean
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          expired?: boolean
          id?: string
          started_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      is_budget_participant: {
        Args: { _entry_id: string; _user_id: string }
        Returns: boolean
      }
      use_invite: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      validate_invite: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "cliente" | "visitante"
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
      app_role: ["admin", "staff", "cliente", "visitante"],
    },
  },
} as const
