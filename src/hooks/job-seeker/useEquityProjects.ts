
import { useState } from "react";
import { EquityProject, JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";

export const useEquityProjects = () => {
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [logEffort, setLogEffort] = useState({
    projectId: '',
    hours: 0,
    description: ''
  });

  const loadEquityProjects = async (userId: string) => {
    try {
      // First load accepted applications
      const { data: acceptedApplications, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks(
            id,
            title,
            description,
            timeframe,
            equity_allocation,
            skills_required,
            business_projects:project_id(
              title,
              business_id,
              businesses:business_id(
                company_name
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');
        
      if (error) throw error;
      
      // Transform applications to equity projects
      const projects = transformToEquityProjects(acceptedApplications || []);
      setEquityProjects(projects);
      
      return projects;
    } catch (error) {
      console.error('Error loading equity projects:', error);
      return [];
    }
  };

  const transformToEquityProjects = (acceptedApplications: JobApplication[]): EquityProject[] => {
    return acceptedApplications
      .filter(app => app.status === 'accepted')
      .map(app => ({
        id: app.task_id,
        project_id: app.project_id,
        equity_amount: app.business_roles?.equity_allocation || 0,
        time_allocated: app.business_roles?.timeframe || '',
        status: 'active',
        start_date: app.applied_at,
        effort_logs: [],
        total_hours_logged: 0,
        title: app.business_roles?.title || '',
        sub_tasks: [{
          id: app.task_id,
          project_id: app.project_id,
          title: app.business_roles?.title || '',
          description: app.business_roles?.description || '',
          timeframe: app.business_roles?.timeframe || '',
          status: 'active',
          equity_allocation: app.business_roles?.equity_allocation || 0,
          skill_requirements: [],
          skills_required: app.business_roles?.skills_required || [],
          task_status: 'active',
          completion_percentage: 0
        }]
      }));
  };

  return {
    equityProjects,
    setEquityProjects,
    logEffort,
    setLogEffort,
    transformToEquityProjects,
    loadEquityProjects
  };
};
