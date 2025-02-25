export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_members: {
        Row: {
          business_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean | null
          project_updates_consent: boolean | null
          terms_accepted: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_consent?: boolean | null
          project_updates_consent?: boolean | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean | null
          project_updates_consent?: boolean | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"]
          company_name: string | null
          company_size: number | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          geographic_scope: Json | null
          id: string
          industry: string | null
          is_parent: boolean | null
          location: string | null
          marketing_consent: boolean | null
          organization_type: string | null
          parent_id: string | null
          project_stage: Database["public"]["Enums"]["project_stage"] | null
          project_timeline: Json | null
          required_skills: Json | null
          terms_accepted: boolean | null
          time_commitment: Database["public"]["Enums"]["time_commitment"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          business_type?: Database["public"]["Enums"]["business_type"]
          company_name?: string | null
          company_size?: number | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          geographic_scope?: Json | null
          id: string
          industry?: string | null
          is_parent?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          organization_type?: string | null
          parent_id?: string | null
          project_stage?: Database["public"]["Enums"]["project_stage"] | null
          project_timeline?: Json | null
          required_skills?: Json | null
          terms_accepted?: boolean | null
          time_commitment?:
            | Database["public"]["Enums"]["time_commitment"]
            | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"]
          company_name?: string | null
          company_size?: number | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          geographic_scope?: Json | null
          id?: string
          industry?: string | null
          is_parent?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          organization_type?: string | null
          parent_id?: string | null
          project_stage?: Database["public"]["Enums"]["project_stage"] | null
          project_timeline?: Json | null
          required_skills?: Json | null
          terms_accepted?: boolean | null
          time_commitment?:
            | Database["public"]["Enums"]["time_commitment"]
            | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_contacts: {
        Row: {
          contact_type: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          preferences: Json | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          user_id: string
        }
        Insert: {
          contact_type?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          preferences?: Json | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id: string
        }
        Update: {
          contact_type?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          preferences?: Json | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          created_at: string | null
          email: string | null
          employment_preference:
            | Database["public"]["Enums"]["employment_preference"]
            | null
          first_name: string | null
          id: string
          is_anonymized: boolean | null
          last_name: string | null
          location: string | null
          marketing_consent: boolean | null
          project_updates_consent: boolean | null
          skills: Json | null
          terms_accepted: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          email?: string | null
          employment_preference?:
            | Database["public"]["Enums"]["employment_preference"]
            | null
          first_name?: string | null
          id: string
          is_anonymized?: boolean | null
          last_name?: string | null
          location?: string | null
          marketing_consent?: boolean | null
          project_updates_consent?: boolean | null
          skills?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          email?: string | null
          employment_preference?:
            | Database["public"]["Enums"]["employment_preference"]
            | null
          first_name?: string | null
          id?: string
          is_anonymized?: boolean | null
          last_name?: string | null
          location?: string | null
          marketing_consent?: boolean | null
          project_updates_consent?: boolean | null
          skills?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recruiter_organizations: {
        Row: {
          company_name: string
          created_at: string | null
          equity_recruiting:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          geographic_scope: Json | null
          id: string
          marketing_consent: boolean | null
          organization_type: string | null
          project_updates_consent: boolean | null
          specializations: Json | null
          terms_accepted: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          equity_recruiting?:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          geographic_scope?: Json | null
          id: string
          marketing_consent?: boolean | null
          organization_type?: string | null
          project_updates_consent?: boolean | null
          specializations?: Json | null
          terms_accepted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          equity_recruiting?:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          geographic_scope?: Json | null
          id?: string
          marketing_consent?: boolean | null
          organization_type?: string | null
          project_updates_consent?: boolean | null
          specializations?: Json | null
          terms_accepted?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          created_at: string | null
          equity_preference:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          first_name: string | null
          geographic_focus: Json | null
          id: string
          last_name: string | null
          marketing_consent: boolean | null
          organization_id: string | null
          project_updates_consent: boolean | null
          skills_focus: Json | null
          terms_accepted: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equity_preference?:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          first_name?: string | null
          geographic_focus?: Json | null
          id: string
          last_name?: string | null
          marketing_consent?: boolean | null
          organization_id?: string | null
          project_updates_consent?: boolean | null
          skills_focus?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equity_preference?:
            | Database["public"]["Enums"]["equity_preference"]
            | null
          first_name?: string | null
          geographic_focus?: Json | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean | null
          organization_id?: string | null
          project_updates_consent?: boolean | null
          skills_focus?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "recruiter_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_type: "startup" | "small" | "medium" | "large" | "enterprise"
      employment_preference: "equity_only" | "salary_only" | "both"
      equity_preference: "yes" | "no" | "negotiable"
      project_stage: "idea" | "prototype" | "mvp" | "growth" | "scale"
      time_commitment: "part_time" | "full_time" | "contract" | "flexible"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
