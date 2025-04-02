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
      accepted_jobs: {
        Row: {
          accepted_discourse: string | null
          created_at: string | null
          date_accepted: string | null
          document_url: string | null
          equity_agreed: number | null
          id: string
          job_app_id: string
          jobs_equity_allocated: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_discourse?: string | null
          created_at?: string | null
          date_accepted?: string | null
          document_url?: string | null
          equity_agreed?: number | null
          id?: string
          job_app_id: string
          jobs_equity_allocated?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_discourse?: string | null
          created_at?: string | null
          date_accepted?: string | null
          document_url?: string | null
          equity_agreed?: number | null
          id?: string
          job_app_id?: string
          jobs_equity_allocated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accepted_jobs_job_app_id_fkey"
            columns: ["job_app_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["job_app_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      business_invitations: {
        Row: {
          accepted_at: string | null
          business_id: string
          company_name: string | null
          created_at: string | null
          first_name: string | null
          id: string
          invited_email: string
          is_child_account: boolean | null
          last_name: string | null
          status: string
          title: string | null
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          invited_email: string
          is_child_account?: boolean | null
          last_name?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          invited_email?: string
          is_child_account?: boolean | null
          last_name?: string | null
          status?: string
          title?: string | null
        }
        Relationships: []
      }
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
            referencedColumns: ["businesses_id"]
          },
        ]
      }
      business_projects: {
        Row: {
          business_id: string
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equity_allocated: number | null
          equity_allocation: number | null
          project_id: string
          project_timeframe: string | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equity_allocated?: number | null
          equity_allocation?: number | null
          project_id?: string
          project_timeframe?: string | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equity_allocated?: number | null
          equity_allocation?: number | null
          project_id?: string
          project_timeframe?: string | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["businesses_id"]
          },
        ]
      }
      business_roles: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string
          open_to_recruiters: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          open_to_recruiters?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          open_to_recruiters?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["businesses_id"]
          },
        ]
      }
      businesses: {
        Row: {
          anonymized_at: string | null
          banking_details: Json | null
          business_type: Database["public"]["Enums"]["business_type"]
          businesses_id: string
          company_address: string | null
          company_name: string | null
          company_size: number | null
          company_website: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          geographic_scope: Json | null
          industry: string | null
          is_also_job_seeker: boolean | null
          is_anonymized: boolean | null
          is_parent: boolean | null
          location: string | null
          marketing_consent: boolean | null
          open_to_recruiters: boolean | null
          organization_type: string | null
          parent_id: string | null
          project_stage: Database["public"]["Enums"]["project_stage"] | null
          project_timeline: Json | null
          required_skills: Json | null
          social_media: Json | null
          terms_accepted: boolean | null
          time_commitment: Database["public"]["Enums"]["time_commitment"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          anonymized_at?: string | null
          banking_details?: Json | null
          business_type?: Database["public"]["Enums"]["business_type"]
          businesses_id: string
          company_address?: string | null
          company_name?: string | null
          company_size?: number | null
          company_website?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          geographic_scope?: Json | null
          industry?: string | null
          is_also_job_seeker?: boolean | null
          is_anonymized?: boolean | null
          is_parent?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          open_to_recruiters?: boolean | null
          organization_type?: string | null
          parent_id?: string | null
          project_stage?: Database["public"]["Enums"]["project_stage"] | null
          project_timeline?: Json | null
          required_skills?: Json | null
          social_media?: Json | null
          terms_accepted?: boolean | null
          time_commitment?:
            | Database["public"]["Enums"]["time_commitment"]
            | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          anonymized_at?: string | null
          banking_details?: Json | null
          business_type?: Database["public"]["Enums"]["business_type"]
          businesses_id?: string
          company_address?: string | null
          company_name?: string | null
          company_size?: number | null
          company_website?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          geographic_scope?: Json | null
          industry?: string | null
          is_also_job_seeker?: boolean | null
          is_anonymized?: boolean | null
          is_parent?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          open_to_recruiters?: boolean | null
          organization_type?: string | null
          parent_id?: string | null
          project_stage?: Database["public"]["Enums"]["project_stage"] | null
          project_timeline?: Json | null
          required_skills?: Json | null
          social_media?: Json | null
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
            referencedColumns: ["businesses_id"]
          },
        ]
      }
      cv_parsed_data: {
        Row: {
          career_history: Json | null
          created_at: string | null
          cv_upload_date: string | null
          cv_url: string | null
          education: Json | null
          id: string
          skills: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_history?: Json | null
          created_at?: string | null
          cv_upload_date?: string | null
          cv_url?: string | null
          education?: Json | null
          id?: string
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_history?: Json | null
          created_at?: string | null
          cv_upload_date?: string | null
          cv_url?: string | null
          education?: Json | null
          id?: string
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          description: string | null
          file_path: string
          file_type: string
          id: string
          name: string
          project_id: string | null
          size_in_kb: number
          ticket_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_path: string
          file_type: string
          id?: string
          name: string
          project_id?: string | null
          size_in_kb: number
          ticket_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          name?: string
          project_id?: string | null
          size_in_kb?: number
          ticket_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_deleted_data: {
        Row: {
          data: Json
          deleted_at: string
          id: string
          user_id: string
          user_type: string
        }
        Insert: {
          data: Json
          deleted_at?: string
          id?: string
          user_id: string
          user_type: string
        }
        Update: {
          data?: Json
          deleted_at?: string
          id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          accepted_business: boolean | null
          accepted_jobseeker: boolean | null
          applicant_anonymized: boolean | null
          applicant_id: string | null
          applied_at: string | null
          created_at: string | null
          cv_url: string | null
          job_app_id: string
          message: string | null
          project_id: string | null
          status: string | null
          task_discourse: string | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_business?: boolean | null
          accepted_jobseeker?: boolean | null
          applicant_anonymized?: boolean | null
          applicant_id?: string | null
          applied_at?: string | null
          created_at?: string | null
          cv_url?: string | null
          job_app_id?: string
          message?: string | null
          project_id?: string | null
          status?: string | null
          task_discourse?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_business?: boolean | null
          accepted_jobseeker?: boolean | null
          applicant_anonymized?: boolean | null
          applicant_id?: string | null
          applied_at?: string | null
          created_at?: string | null
          cv_url?: string | null
          job_app_id?: string
          message?: string | null
          project_id?: string | null
          status?: string | null
          task_discourse?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_applications_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "job_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_sub_tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      jobs: {
        Row: {
          business_id: string | null
          id: string
          is_hidden: boolean | null
          status: string | null
        }
        Insert: {
          business_id?: string | null
          id?: string
          is_hidden?: boolean | null
          status?: string | null
        }
        Update: {
          business_id?: string | null
          id?: string
          is_hidden?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["businesses_id"]
          },
        ]
      }
      marketing_contacts: {
        Row: {
          contact_type: string | null
          email: string
          first_name: string | null
          last_name: string | null
          marketing_id: string
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
          last_name?: string | null
          marketing_id?: string
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
          last_name?: string | null
          marketing_id?: string
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
          account_type: string | null
          address: string | null
          anonymized_at: string | null
          availability: string | null
          bio: string | null
          created_at: string | null
          cv_url: string | null
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
          phone: string | null
          project_updates_consent: boolean | null
          skills: Json | null
          social_links: Json | null
          terms_accepted: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          anonymized_at?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          cv_url?: string | null
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
          phone?: string | null
          project_updates_consent?: boolean | null
          skills?: Json | null
          social_links?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          anonymized_at?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          cv_url?: string | null
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
          phone?: string | null
          project_updates_consent?: boolean | null
          skills?: Json | null
          social_links?: Json | null
          terms_accepted?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_notifications: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          status: string | null
          task_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_sub_tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      project_sub_tasks: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          dependencies: string[] | null
          description: string | null
          equity_allocation: number
          estimated_hours: number | null
          last_activity_at: string | null
          project_id: string | null
          skill_requirements: Json | null
          skills_required: string[] | null
          status: string | null
          task_id: string
          task_status: string | null
          timeframe: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          equity_allocation: number
          estimated_hours?: number | null
          last_activity_at?: string | null
          project_id?: string | null
          skill_requirements?: Json | null
          skills_required?: string[] | null
          status?: string | null
          task_id?: string
          task_status?: string | null
          timeframe: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          equity_allocation?: number
          estimated_hours?: number | null
          last_activity_at?: string | null
          project_id?: string | null
          skill_requirements?: Json | null
          skills_required?: string[] | null
          status?: string | null
          task_id?: string
          task_status?: string | null
          timeframe?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sub_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          equity_earned: number | null
          hours_logged: number | null
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          equity_earned?: number | null
          hours_logged?: number | null
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          equity_earned?: number | null
          hours_logged?: number | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      recruiter_organizations: {
        Row: {
          banking_details: Json | null
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
          banking_details?: Json | null
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
          banking_details?: Json | null
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
      ticket_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_documents: {
        Row: {
          description: string | null
          file_path: string
          file_type: string
          id: string
          name: string
          project_id: string | null
          size_in_kb: number
          ticket_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_path: string
          file_type: string
          id?: string
          name: string
          project_id?: string | null
          size_in_kb: number
          ticket_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          name?: string
          project_id?: string | null
          size_in_kb?: number
          ticket_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ticket_documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          hours_logged: number | null
          id: string
          start_time: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          equity_points: number | null
          estimated_hours: number | null
          health: string
          id: string
          job_app_id: string | null
          notes: Json | null
          priority: string
          project_id: string | null
          replies: Json | null
          reporter: string | null
          reproduction_steps: string | null
          status: string
          system_info: string | null
          task_id: string | null
          ticket_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equity_points?: number | null
          estimated_hours?: number | null
          health: string
          id?: string
          job_app_id?: string | null
          notes?: Json | null
          priority: string
          project_id?: string | null
          replies?: Json | null
          reporter?: string | null
          reproduction_steps?: string | null
          status: string
          system_info?: string | null
          task_id?: string | null
          ticket_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equity_points?: number | null
          estimated_hours?: number | null
          health?: string
          id?: string
          job_app_id?: string | null
          notes?: Json | null
          priority?: string
          project_id?: string | null
          replies?: Json | null
          reporter?: string | null
          reproduction_steps?: string | null
          status?: string
          system_info?: string | null
          task_id?: string | null
          ticket_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_job_app_id_fkey"
            columns: ["job_app_id"]
            isOneToOne: false
            referencedRelation: "accepted_jobs"
            referencedColumns: ["job_app_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_sub_tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          hours_logged: number | null
          id: string
          job_app_id: string | null
          start_time: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          job_app_id?: string | null
          start_time: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          job_app_id?: string | null
          start_time?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_app_id_fkey"
            columns: ["job_app_id"]
            isOneToOne: false
            referencedRelation: "accepted_jobs"
            referencedColumns: ["job_app_id"]
          },
          {
            foreignKeyName: "time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean
          recipient_id: string
          related_ticket: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean
          recipient_id: string
          related_ticket?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean
          recipient_id?: string
          related_ticket?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_related_ticket_fkey"
            columns: ["related_ticket"]
            isOneToOne: false
            referencedRelation: "jobseeker_active_projects"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "user_messages_related_ticket_fkey"
            columns: ["related_ticket"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      jobseeker_active_projects: {
        Row: {
          application_status: string | null
          assigned_to: string | null
          business_id: string | null
          date_accepted: string | null
          due_date: string | null
          equity_agreed: number | null
          equity_points: number | null
          estimated_hours: number | null
          job_app_id: string | null
          project_completion: number | null
          project_description: string | null
          project_id: string | null
          project_status: string | null
          project_title: string | null
          reporter: string | null
          task_id: string | null
          ticket_created_at: string | null
          ticket_description: string | null
          ticket_health: string | null
          ticket_id: string | null
          ticket_priority: string | null
          ticket_status: string | null
          ticket_title: string | null
          ticket_updated_at: string | null
          total_hours_logged: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["businesses_id"]
          },
          {
            foreignKeyName: "tickets_job_app_id_fkey"
            columns: ["job_app_id"]
            isOneToOne: false
            referencedRelation: "accepted_jobs"
            referencedColumns: ["job_app_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_sub_tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
    }
    Functions: {
      create_messages_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_profile: {
        Args: {
          user_type: string
          user_id: string
        }
        Returns: undefined
      }
      extract_ticket_id_from_path: {
        Args: {
          path: string
        }
        Returns: string
      }
      is_project_member: {
        Args: {
          project_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      is_project_owner: {
        Args: {
          project_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      is_ticket_owner_or_admin: {
        Args: {
          ticket_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      path_contains_project_id: {
        Args: {
          file_path: string
          user_id: string
        }
        Returns: boolean
      }
      path_contains_user_id: {
        Args: {
          path: string
          user_id: string
        }
        Returns: boolean
      }
      update_active_project: {
        Args: {
          p_task_id: string
          p_completion_percentage?: number
          p_estimated_hours?: number
          p_due_date?: string
          p_status?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      business_type: "startup" | "small" | "medium" | "large" | "enterprise"
      employment_preference: "equity_only" | "salary_only" | "both" | "equity"
      equity_preference: "yes" | "no" | "negotiable"
      project_stage: "idea" | "prototype" | "mvp" | "growth" | "scale" | "early"
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
