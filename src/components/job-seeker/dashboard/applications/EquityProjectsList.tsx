
import { useEffect, useState } from "react";
import { EquityProject, JobApplication, Skill } from "@/types/jobSeeker";
import { EquityProjectItem } from "./EquityProjectItem";
import { EmptyState } from "../opportunities/EmptyState";

interface EquityProjectsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const EquityProjectsList = ({
  applications,
  onApplicationUpdated
}: EquityProjectsListProps) => {
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    // Convert accepted applications to equity projects
    const convertToProjects = (acceptedApps: JobApplication[]): EquityProject[] => {
      return acceptedApps.map(app => {
        // Convert skill_requirements to ensure they're all Skill objects
        const skillRequirements = app.business_roles?.skill_requirements || [];
        const formattedSkillRequirements: Skill[] = skillRequirements.map(skill => 
          typeof skill === 'string' ? { skill, level: 'Intermediate' } : skill as Skill
        );

        const project: EquityProject = {
          id: app.task_id || `app-${Math.random()}`,
          project_id: app.project_id || "",
          title: app.business_roles?.title || "Untitled Project",
          equity_amount: app.business_roles?.equity_allocation || 0,
          time_allocated: app.business_roles?.timeframe || "",
          status: app.status || "active",
          start_date: app.created_at || app.applied_at || new Date().toISOString(),
          effort_logs: [],
          total_hours_logged: 0,
          business_roles: {
            title: app.business_roles?.title || "",
            description: app.business_roles?.description || "",
            company_name: app.business_roles?.company_name || "",
            project_title: app.business_roles?.project_title || "",
            timeframe: app.business_roles?.timeframe || "",
            equity_allocation: app.business_roles?.equity_allocation || 0,
            skill_requirements: formattedSkillRequirements,
          },
          job_app_id: app.job_app_id // Add job_app_id to link with accepted_jobs
        };

        return project;
      });
    };

    const acceptedApplications = applications.filter(app => app.status === 'accepted');
    setEquityProjects(convertToProjects(acceptedApplications));
  }, [applications]);

  const handleWithdrawApplication = async (appId: string, reason?: string) => {
    try {
      setIsWithdrawing(true);
      
      // Implementation for withdrawing application would go here
      console.log(`Withdrawing application ${appId} with reason: ${reason}`);
      
      // Refresh applications after withdrawal
      onApplicationUpdated();
    } catch (error) {
      console.error("Error withdrawing application:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAcceptJob = async (application: JobApplication) => {
    try {
      // Implementation for accepting job would go here
      console.log(`Accepting job application:`, application);
      
      // Refresh applications after acceptance
      onApplicationUpdated();
    } catch (error) {
      console.error("Error accepting job:", error);
    }
  };

  if (equityProjects.length === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <div className="space-y-4">
      {equityProjects.map(project => (
        <EquityProjectItem
          key={project.id}
          project={project}
          onWithdraw={handleWithdrawApplication}
          onAccept={handleAcceptJob}
          isWithdrawing={isWithdrawing}
        />
      ))}
    </div>
  );
};
