
import { supabase } from '@/lib/supabase';
import { Ticket, UserData } from '@/types/types';
import { toast } from 'sonner';

export class TicketService {
  static async createTicket(ticket: Partial<Ticket>): Promise<Ticket | null> {
    try {
      // Ensure ticket has required fields with non-empty values
      const sanitizedTicket = {
        ...ticket,
        status: ticket.status || 'new',
        priority: ticket.priority || 'medium',
        title: ticket.title || 'Untitled Ticket',
        description: ticket.description || 'No description provided'
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(sanitizedTicket)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return null;
    }
  }
  
  static async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    try {
      // Validate status and priority to ensure they're never empty
      const sanitizedUpdates = {
        ...updates
      };
      
      if ('status' in updates && (!updates.status || updates.status.trim() === '')) {
        sanitizedUpdates.status = 'new';
      }
      
      if ('priority' in updates && (!updates.priority || updates.priority.trim() === '')) {
        sanitizedUpdates.priority = 'medium';
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .update(sanitizedUpdates)
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return null;
    }
  }
  
  static async deleteTicket(ticketId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      return false;
    }
  }
  
  static async addComment(ticketId: string, content: string, userId: string): Promise<boolean> {
    try {
      // Get the current ticket
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Create new comment
      const newComment = {
        id: crypto.randomUUID(),
        user: userId,
        timestamp: new Date().toISOString(),
        content: content,
        action: 'comment'
      };
      
      // Add to existing notes or create new array
      const updatedNotes = ticket.notes ? [...ticket.notes, newComment] : [newComment];
      
      // Update the ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ notes: updatedNotes })
        .eq('id', ticketId);
        
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return false;
    }
  }
  
  static async getUserProfile(userId: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Ensure we have safe values
      const userData: UserData = {
        first_name: data.first_name || 'Anonymous',
        last_name: data.last_name || 'User',
        company_name: data.company_name || ''
      };
      
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}
