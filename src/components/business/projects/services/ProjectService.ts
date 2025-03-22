
import { supabase } from "@/lib/supabase";

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: any[];
  id?: string; // Add id as an optional property for compatibility
}

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    const { data, error } = await supabase
      .from('business_projects')
      .select(`
        *,
        businesses!inner (
          company_name
        )
      `);
      
    if (error) throw error;
    
    // Map the data to ensure it has both project_id and id for compatibility
    const projectsWithId = data.map((project: any) => ({
      ...project,
      id: project.project_id, // Ensure each project has an id that matches project_id
    }));
    
    return projectsWithId;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const ProjectService = {
  updateProject: async (project: Project, updatedData: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          status: updatedData.status,
          equity_allocation: updatedData.equity_allocation,
          skills_required: updatedData.skills_required,
          project_timeframe: updatedData.project_timeframe
        })
        .eq('project_id', project.project_id)
        .select()
        .single();

      if (error) throw error;

      return { ...project, ...data };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }
};
