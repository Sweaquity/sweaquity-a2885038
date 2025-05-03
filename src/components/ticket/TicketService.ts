import { supabase } from '@/lib/supabase';
import { Ticket, UserData } from '@/types/types';
import { toast } from 'sonner';

export const TicketService = {
  /**
   * Get all tickets
   */
  async getTickets(): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
      return [];
    }
  },

  /**
   * Get a specific ticket by ID
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to fetch ticket details');
      return null;
    }
  },

  /**
   * Soft deletes a ticket by:
   * 1. Copying it to the deleted_tickets table
   * 2. Marking who deleted it
   * 3. Removing it from the active tickets table
   */
  async deleteTicket(ticketId: string, userId: string): Promise<boolean> {
    try {
      // Fetch the ticket to be deleted
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (fetchError) throw fetchError;
      if (!ticket) throw new Error('Ticket not found');

      // Insert into deleted_tickets table
      const { error: insertError } = await supabase
        .from('deleted_tickets')
        .insert({
          original_id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          type: ticket.type,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          due_date: ticket.due_date,
          assignee_id: ticket.assigned_to, // Note the field name difference
          reporter_id: ticket.created_by, // Note the field name difference
          project_id: ticket.project_id,
          estimated_hours: ticket.estimated_hours,
          completion_percentage: ticket.completion_percentage,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        });

      if (insertError) throw insertError;

      // Delete from tickets table
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (deleteError) throw deleteError;
      
      toast.success('Ticket successfully deleted');
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      return false;
    }
  },

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, newStatus: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
      return null;
    }
  },
  
  /**
   * Update ticket priority
   */
  async updateTicketPriority(ticketId: string, newPriority: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast.error('Failed to update ticket priority');
      return null;
    }
  },
  
  /**
   * Update ticket due date
   */
  async updateTicketDueDate(ticketId: string, newDueDate: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          due_date: newDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket due date:', error);
      toast.error('Failed to update ticket due date');
      return null;
    }
  },
  
  /**
   * Update ticket assignee
   */
  async updateTicketAssignee(ticketId: string, assigneeId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket assignee:', error);
      toast.error('Failed to update ticket assignee');
      return null;
    }
  },
  
  /**
   * Update ticket completion percentage
   */
  async updateTicketCompletionPercentage(ticketId: string, percentage: number): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          completion_percentage: percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket completion percentage:', error);
      toast.error('Failed to update ticket completion');
      return null;
    }
  },
  
  /**
   * Update ticket estimated hours
   */
  async updateTicketEstimatedHours(ticketId: string, hours: number): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          estimated_hours: hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket estimated hours:', error);
      toast.error('Failed to update estimated hours');
      return null;
    }
  },
  
  /**
   * Load user data
   */
  async loadUserData(userId: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email || ''
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  },
  
  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
        
      if (error) throw error;
      
      return data.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || ''
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },
  
  /**
   * Log time for a ticket
   */
  async logTime(ticketId: string, userId: string, hours: number, description: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: hours,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
        });
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error('Failed to log time');
      return false;
    }
  }
};
