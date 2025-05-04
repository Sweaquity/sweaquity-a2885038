
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Checks if a ticket can be deleted by verifying if it has time entries
 * or completion progress
 * @param ticketId - The ID of the ticket to check
 * @returns true if the ticket can be deleted, false otherwise
 */
export const canDeleteTicket = async (ticketId: string): Promise<boolean> => {
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
};

/**
 * Soft deletes a ticket by:
 * 1. Checking if the ticket can be deleted
 * 2. Copying it to the deleted_tickets table
 * 3. Marking it as deleted in the tickets table
 * @param ticketId - The ID of the ticket to delete
 * @param userId - The ID of the user performing the deletion
 * @returns true if the operation was successful, false otherwise
 */
export const deleteTicket = async (ticketId: string, userId: string): Promise<boolean> => {
  try {
    // Use the database function for soft deletion
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
        toast.error('Failed to delete ticket');
      }
      return false;
    }
    
    toast.success('Ticket successfully deleted');
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    toast.error('Failed to delete ticket');
    return false;
  }
};
