
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: any[];
  dependencies: string[];
}

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  equity_allocated: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('business_projects')
      .select('*')
      .eq('business_id', session.user.id);

    if (projectsError) throw projectsError;

    const { data: tasksData, error: tasksError } = await supabase
      .from('project_sub_tasks')
      .select('*');

    if (tasksError) throw tasksError;

    const projectsWithTasks = projectsData.map((project: any) => ({
      ...project,
      tasks: tasksData.filter((task: any) => task.project_id === project.project_id) || []
    }));

    return projectsWithTasks;
  } catch (error) {
    console.error('Error loading projects:', error);
    toast.error("Failed to load projects");
    return [];
  }
};

export const deleteProject = async (projectId: string, projects: Project[]): Promise<boolean> => {
  try {
    // Check if project has allocated equity
    const project = projects.find(p => p.project_id === projectId);
    if (project && project.equity_allocated > 0) {
      toast.error("Cannot delete a project with allocated equity");
      return false;
    }
    
    const { error } = await supabase
      .from('business_projects')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;

    toast.success("Project deleted successfully");
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    toast.error("Failed to delete project");
    return false;
  }
};
