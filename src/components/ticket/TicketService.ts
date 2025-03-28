
import { supabase } from '@/lib/supabase';
import { Ticket, UserData } from '@/types/types';
import { toast } from 'sonner';

export const TicketService = {
  async updateTicketStatus(ticketId: string, newStatus: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
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
  
  async updateTicketPriority(ticketId: string, newPriority: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
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
  
  async updateTicketDueDate(ticketId: string, newDueDate: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ due_date: newDueDate })
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
  
  async updateTicketAssignee(ticketId: string, assigneeId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ assigned_to: assigneeId })
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
  
  async updateTicketCompletionPercentage(ticketId: string, percentage: number): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ completion_percentage: percentage })
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
