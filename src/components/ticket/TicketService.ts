
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

    // If the status is 'done', check if this is a task ticket
    if (newStatus === 'done') {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, project_id')
        .eq('id', ticketId)
        .single();
        
      if (!ticketError && ticketData?.task_id) {
        // Update the task status to pending review
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            task_status: 'pending_review',
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticketData.task_id);
          
        if (taskError) {
          console.error("Error updating task status:", taskError);
        }
      }
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

/**
 * Updates the completion percentage of a task and calculates equity points
 */
export async function updateCompletionPercentage(ticketId: string, completionPercentage: number): Promise<void> {
  try {
    // First, get the ticket info
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('task_id, job_app_id')
      .eq('id', ticketId)
      .single();
      
    if (ticketError) {
      console.error("Error fetching ticket data:", ticketError);
      throw ticketError;
    }
    
    if (!ticketData.task_id) {
      console.error("This ticket is not associated with a task");
      return;
    }
    
    // Update the task completion percentage
    const { error: taskError } = await supabase
      .from('project_sub_tasks')
      .update({ 
        completion_percentage: completionPercentage,
        last_activity_at: new Date().toISOString()
      })
      .eq('task_id', ticketData.task_id);
      
    if (taskError) {
      console.error("Error updating task completion:", taskError);
      throw taskError;
    }
    
    // If there's a job application ID, calculate equity points
    if (ticketData.job_app_id) {
      const { data: acceptedJob, error: jobError } = await supabase
        .from('accepted_jobs')
        .select('equity_agreed')
        .eq('job_app_id', ticketData.job_app_id)
        .maybeSingle();
        
      if (jobError) {
        console.error("Error fetching job data:", jobError);
        throw jobError;
      }
      
      if (acceptedJob) {
        const equityPoints = (acceptedJob.equity_agreed * (completionPercentage / 100)).toFixed(2);
        
        // Update the ticket's equity points
        const { error: equityError } = await supabase
          .from('tickets')
          .update({ 
            equity_points: equityPoints,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (equityError) {
          console.error("Error updating equity points:", equityError);
          throw equityError;
        }
      }
    }
  } catch (error) {
    console.error("Error in updateCompletionPercentage:", error);
    throw error;
  }
}

/**
 * Approves a completed task and allocates equity
 */
export async function approveTaskCompletion(taskId: string): Promise<void> {
  try {
    // Update the task as completed
    const { error: taskError } = await supabase
      .from('project_sub_tasks')
      .update({ 
        task_status: 'completed',
        completion_percentage: 100,
        last_activity_at: new Date().toISOString()
      })
      .eq('task_id', taskId);
      
    if (taskError) {
      console.error("Error updating task status:", taskError);
      throw taskError;
    }
    
    // Get all tickets associated with this task
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, job_app_id')
      .eq('task_id', taskId);
      
    if (ticketsError) {
      console.error("Error fetching task tickets:", ticketsError);
      throw ticketsError;
    }
    
    // Process each ticket
    for (const ticket of tickets || []) {
      if (ticket.job_app_id) {
        // Get the agreed equity for this job
        const { data: jobData, error: jobError } = await supabase
          .from('accepted_jobs')
          .select('equity_agreed')
          .eq('job_app_id', ticket.job_app_id)
          .maybeSingle();
          
        if (jobError) {
          console.error("Error fetching job data:", jobError);
          continue;
        }
        
        if (jobData) {
          // Update the ticket to allocate full equity
          await supabase
            .from('tickets')
            .update({ 
              equity_points: jobData.equity_agreed,
              status: 'done',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);
        }
      }
    }
  } catch (error) {
    console.error("Error in approveTaskCompletion:", error);
    throw error;
  }
}

/**
 * Adds a note to a ticket
 */
export async function addNoteToTicket(ticketId: string, note: string, userId: string, userType: 'job_seeker' | 'business'): Promise<void> {
  try {
    // Get the current notes
    const { data: ticketData, error: getError } = await supabase
      .from('tickets')
      .select('notes')
      .eq('id', ticketId)
      .single();
    
    if (getError) {
      console.error("Error fetching ticket notes:", getError);
      throw getError;
    }
    
    const currentNotes = ticketData.notes || [];
    
    // Get user info for the note
    const { data: userData, error: userError } = await supabase
      .from(userType === 'job_seeker' ? 'profiles' : 'businesses')
      .select(userType === 'job_seeker' ? 'first_name, last_name' : 'company_name')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("Error fetching user data:", userError);
      throw userError;
    }
    
    const userName = userType === 'job_seeker'
      ? `${userData.first_name} ${userData.last_name}`
      : userData.company_name;
    
    // Add the new note
    const newNote = {
      id: crypto.randomUUID(),
      user: userName,
      timestamp: new Date().toISOString(),
      content: note
    };
    
    const updatedNotes = [...currentNotes, newNote];
    
    // Update the ticket
    const { error } = await supabase
      .from('tickets')
      .update({ 
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    
    if (error) {
      console.error("Error updating ticket notes:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in addNoteToTicket:", error);
    throw error;
  }
}
