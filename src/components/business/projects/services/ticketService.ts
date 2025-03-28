
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

export const loadTickets = async (businessId: string, selectedProject: string) => {
  if (!businessId) return [];
  
  try {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        job_app_id,
        accepted_jobs:job_app_id(
          equity_agreed,
          jobs_equity_allocated
        )
      `);
    
    // Filter by project if one is selected and it's not "all"
    if (selectedProject && selectedProject !== "all") {
      query = query.eq('project_id', selectedProject);
    } else {
      // If "all" is selected, get tickets from all projects owned by this business
      const { data: businessProjects } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('business_id', businessId);
        
      if (businessProjects && businessProjects.length > 0) {
        const projectIds = businessProjects.map(p => p.project_id);
        query = query.in('project_id', projectIds);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log("Loaded tickets:", data);
    
    // Convert data to the expected Ticket type format and include job_app_id/equity data
    return (data || []).map(ticket => ({
      ...ticket,
      type: ticket.ticket_type || "task", // Map ticket_type to type for compatibility
      description: ticket.description || "", // Ensure description exists
      // Add equity information to the ticket
      equity_agreed: ticket.accepted_jobs?.equity_agreed || 0,
      equity_allocated: ticket.accepted_jobs?.jobs_equity_allocated || 0
    }));
  } catch (error) {
    console.error("Error loading tickets:", error);
    toast.error("Failed to load tickets");
    return [];
  }
};

export const fetchProjects = async (businessId: string) => {
  if (!businessId) return [];
  
  try {
    const { data: projectsData, error } = await supabase
      .from('business_projects')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return projectsData || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    toast.error("Failed to load projects");
    return [];
  }
};

export const handleTicketAction = async (
  ticketId: string, 
  action: string, 
  data: any, 
  businessId: string,
  tickets: Ticket[], 
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>
) => {
  try {
    switch (action) {
      case 'updateStatus': {
        // Update ticket status
        const { error } = await supabase
          .from('tickets')
          .update({ status: data })
          .eq('id', ticketId);
        
        if (error) throw error;
        
        // Update local state
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, status: data } : t)
        );
        
        toast.success("Status updated");
        break;
      }
      
      case 'updatePriority': {
        const { error } = await supabase
          .from('tickets')
          .update({ priority: data })
          .eq('id', ticketId);
        
        if (error) throw error;
        
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, priority: data } : t)
        );
        
        toast.success("Priority updated");
        break;
      }
      
      case 'updateDueDate': {
        const { error } = await supabase
          .from('tickets')
          .update({ due_date: data })
          .eq('id', ticketId);
        
        if (error) throw error;
        
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, due_date: data } : t)
        );
        
        toast.success("Due date updated");
        break;
      }
      
      case 'updateCompletionPercentage': {
        const { error } = await supabase
          .from('tickets')
          .update({ completion_percentage: data })
          .eq('id', ticketId);
        
        if (error) throw error;
        
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, completion_percentage: data } : t)
        );
        
        toast.success("Completion percentage updated");
        break;
      }
      
      case 'updateEstimatedHours': {
        const { error } = await supabase
          .from('tickets')
          .update({ estimated_hours: data })
          .eq('id', ticketId);
        
        if (error) throw error;
        
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, estimated_hours: data } : t)
        );
        
        toast.success("Estimated hours updated");
        break;
      }
      
      case 'addNote': {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('notes')
          .eq('id', ticketId)
          .single();
        
        const { data: profileData } = await supabase
          .from('businesses')
          .select('company_name')
          .eq('businesses_id', businessId)
          .single();
        
        const userName = profileData ? profileData.company_name : 'Business';
        
        const newNote = {
          id: Date.now().toString(),
          user: userName,
          timestamp: new Date().toISOString(),
          comment: data
        };
        
        const currentNotes = ticketData?.notes || [];
        const updatedNotes = [...currentNotes, newNote];
        
        await supabase
          .from('tickets')
          .update({ notes: updatedNotes })
          .eq('id', ticketId);
        
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? { ...t, notes: updatedNotes } : t)
        );
        
        toast.success("Note added");
        break;
      }
      
      default:
        console.warn("Unknown action:", action);
    }
  } catch (error) {
    console.error("Error handling ticket action:", error);
    toast.error("Failed to update ticket");
  }
};

export const handleLogTime = async (ticketId: string, hours: number, description: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to log time");
      return;
    }
    
    const { error } = await supabase
      .from('time_entries')
      .insert({
        ticket_id: ticketId,
        user_id: session.user.id,
        description: description,
        hours_logged: hours,
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
      });
      
    if (error) throw error;
    
    toast.success("Time logged successfully");
    return true;
  } catch (error) {
    console.error("Error logging time:", error);
    toast.error("Failed to log time");
    return false;
  }
};

export const createTicket = async (ticketData: any, businessId: string) => {
  try {
    const ticketToCreate = {
      ...ticketData,
      reporter: businessId,
      created_at: new Date().toISOString(),
      ticket_type: ticketData.ticket_type || "task", // Using ticket_type instead of type
      status: "todo", // Changed from "new" to match Kanban column ids
      priority: ticketData.priority || "medium",
      health: ticketData.health || "good"
    };
    
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketToCreate)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success("Ticket created successfully");
    return data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    toast.error("Failed to create ticket");
    return null;
  }
};
