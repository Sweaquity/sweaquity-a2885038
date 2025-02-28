
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
}

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
