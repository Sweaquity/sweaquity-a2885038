
// We only need to add the missing fields to the Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  created_by: string;
  created_at: string;
  project_id: string;
  due_date?: string;
  ticket_type?: string; // Add the missing ticket_type field
}
