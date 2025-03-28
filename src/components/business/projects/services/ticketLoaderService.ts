
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

/**
 * Loads tickets for a business based on selected project
 */
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
    
    if (selectedProject && selectedProject !== "all") {
      query = query.eq('project_id', selectedProject);
    } else {
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
    
    return (data || []).map(ticket => ({
      ...ticket,
      type: ticket.ticket_type || "task",
      description: ticket.description || "",
      equity_agreed: ticket.accepted_jobs?.equity_agreed || 0,
      equity_allocated: ticket.accepted_jobs?.jobs_equity_allocated || 0
    }));
  } catch (error) {
    console.error("Error loading tickets:", error);
    toast.error("Failed to load tickets");
    return [];
  }
};

/**
 * Fetches projects for a business
 */
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
