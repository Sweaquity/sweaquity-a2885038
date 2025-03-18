
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          health: string
          estimated_hours: number | null
          created_at: string
          updated_at: string
          due_date: string | null
          assigned_to: string | null
          reporter: string | null
          project_id: string | null
          equity_points: number
          task_id: string | null
          created_by: string | null
          ticket_type: string
          notes: Json[] | null
          replies: Json[] | null
        }
      }
      user_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string
          message: string
          related_ticket: string | null
          created_at: string
          read: boolean
        }
      }
    }
  }
}
