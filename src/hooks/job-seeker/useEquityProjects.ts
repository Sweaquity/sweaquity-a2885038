
import { useState } from "react";
import { EquityProject, JobApplication, Skill } from "@/types/jobSeeker";

export const useEquityProjects = () => {
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [logEffort, setLogEffort] = useState({
    projectId: '',
    hours: 0,
    description: ''
  });

  const transformToEquityProjects = (acceptedApplications: JobApplication[]): EquityProject[] => {
    return acceptedApplications
      .filter(app => app.status === 'accepted')
      .map(app => {
        // Ensure skill_requirements are properly formatted as Skill objects
        const skillRequirements = app.business_roles?.skill_requirements || [];
        const formattedSkills: Skill[] = skillRequirements.map(skill => 
          typeof skill === 'string' 
            ? { skill, level: 'Intermediate' } 
            : skill as Skill
        );

        return {
          id: app.task_id || app.job_app_id || '',
          project_id: app.project_id || '',
          equity_amount: app.business_roles?.equity_allocation || 0,
          time_allocated: app.business_roles?.timeframe || '',
          status: 'active',
          start_date: app.applied_at || new Date().toISOString(),
          effort_logs: [],
          total_hours_logged: 0,
          title: app.business_roles?.title || '',
          job_app_id: app.job_app_id, // Add job_app_id to allow proper data linking
          business_roles: app.business_roles,
          sub_tasks: [{
            id: app.task_id || '',
            task_id: app.task_id || '',
            project_id: app.project_id || '',
            title: app.business_roles?.title || '',
            description: app.business_roles?.description || '',
            timeframe: app.business_roles?.timeframe || '',
            status: 'active',
            equity_allocation: app.business_roles?.equity_allocation || 0,
            skill_requirements: formattedSkills,
            task_status: 'active',
            completion_percentage: 0
          }]
        };
      });
  };

  return {
    equityProjects,
    setEquityProjects,
    logEffort,
    setLogEffort,
    transformToEquityProjects
  };
};
