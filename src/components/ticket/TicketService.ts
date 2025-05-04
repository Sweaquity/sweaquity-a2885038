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
   * Check if a ticket has time entries or completion progress
   * Returns true if the ticket is eligible for deletion
   */
  async canDeleteTicket(ticketId: string): Promise<boolean> {
    try {
      // Check for time entries
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('id')
        .eq('ticket_id', ticketId)
        .limit(1);
        
      if (timeError) throw timeError;
      
      // If there are any time entries, ticket cannot be deleted
      if (timeEntries && timeEntries.length > 0) {
        toast.error('Cannot delete ticket with logged time entries');
        return false;
      }
      
      // Check ticket completion percentage
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('completion_percentage')
        .eq('id', ticketId)
        .single();
        
      if (ticketError) throw ticketError;
      
      // If completion percentage is greater than 0, ticket cannot be deleted
      if (ticket && ticket.completion_percentage > 0) {
        toast.error('Cannot delete ticket with completion progress');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if ticket can be deleted:', error);
      toast.error('Error checking if ticket can be deleted');
      return false;
    }
  },

  /**
   * Soft deletes a ticket using the database function
   * This copies the ticket to deleted_tickets and marks it as deleted in the tickets table
   */
  async deleteTicket(ticketId: string, userId: string): Promise<boolean> {
    try {
      // Use the fixed database function for soft deletion
      const { data, error } = await supabase
        .rpc('soft_delete_ticket', { 
          ticket_id: ticketId, 
          user_id: userId 
        });

      if (error) {
        console.error("Error in soft_delete_ticket:", error);
        if (error.message.includes('time entries')) {
          toast.error('Cannot delete ticket with logged time entries');
        } else if (error.message.includes('completion progress')) {
          toast.error('Cannot delete ticket with completion progress');
        } else {
          toast.error('Failed to delete ticket: ' + error.message);
        }
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket: ' + (error.message || 'Unknown error'));
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
