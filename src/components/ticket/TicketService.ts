
import { Ticket } from "@/types/types";
import { supabase } from "@/lib/supabase";

/**
 * Fetches tickets from the backend, optionally filtered by project
 */
export async function fetchTickets(projectFilter?: string): Promise<Ticket[]> {
  try {
    let query = supabase.from('tickets').select('*');
    
    if (projectFilter) {
      query = query.eq('project_id', projectFilter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }

    // Process tickets to include expanded state
    const tickets: Ticket[] = data.map(ticket => ({
      ...ticket,
      expanded: false,
      newNote: ''
    }));

    return tickets;
  } catch (error) {
    console.error("Error in fetchTickets:", error);
    throw error;
  }
}

/**
 * Updates the status of a ticket
 */
export async function updateTicketStatus(ticketId: string, newStatus: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error("Error updating ticket status:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateTicketStatus:", error);
    throw error;
  }
}

/**
 * Updates the priority of a ticket
 */
export async function updateTicketPriority(ticketId: string, newPriority: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        priority: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error("Error updating ticket priority:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateTicketPriority:", error);
    throw error;
  }
}

/**
 * Sets the due date for a ticket
 */
export async function setTicketDueDate(ticketId: string, newDueDate: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        due_date: newDueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error("Error setting due date:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in setTicketDueDate:", error);
    throw error;
  }
}
