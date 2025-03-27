
import { useEffect, useState } from "react";
import { EquityProject, JobApplication } from "@/types/jobSeeker";
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
      return acceptedApps.map(app => ({
        id: app.job_app_id || app.id || `app-${Math.random()}`,
        project_id: app.project_id || "",
        title: app.business_roles?.title || "Untitled Project",
        equity_amount: app.business_roles?.equity_allocation || 0,
        time_allocated: app.business_roles?.timeframe || "",
        status: app.status || "active",
        start_date: app.created_at || app.applied_at || new Date().toISOString(),
        effort_logs: [],
        total_hours_logged: 0,
        business_roles: app.business_roles,
        job_app_id: app.job_app_id, // Add job_app_id to the project
        sub_tasks: [{
          id: app.task_id || "",
          task_id: app.task_id || "",
          project_id: app.project_id || "",
          title: app.business_roles?.title || "Untitled Task",
          description: app.business_roles?.description || "",
          timeframe: app.business_roles?.timeframe || "",
          status: app.status || "active",
          equity_allocation: app.business_roles?.equity_allocation || 0,
          skill_requirements: app.business_roles?.skill_requirements || [],
          task_status: app.status || "active",
          completion_percentage: 0
        }]
      }));
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
