
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Soft deletes a ticket by:
 * 1. Checking if the ticket can be deleted
 * 2. Copying it to the deleted_tickets table
 * 3. Marking who deleted it
 * 4. Removing it from the active tickets table
 */
export const deleteTicket = async (ticketId: string, userId: string): Promise<boolean> => {
  try {
    // First check if the ticket can be deleted
    const canDelete = await canDeleteTicket(ticketId);
    if (!canDelete) {
      return false;
    }
    
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
        type: ticket.ticket_type || ticket.type || 'task',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        due_date: ticket.due_date,
        assignee_id: ticket.assigned_to, // Note the field name difference
        reporter_id: ticket.created_by || ticket.reporter, // Note the field name difference
        project_id: ticket.project_id,
        estimated_hours: ticket.estimated_hours,
        completion_percentage: ticket.completion_percentage || 0,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      });

    if (insertError) {
      console.error("Error inserting into deleted_tickets:", insertError);
      throw insertError;
    }

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
};

/**
 * Check if a ticket has time entries or completion progress
 * Returns true if the ticket is eligible for deletion
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
