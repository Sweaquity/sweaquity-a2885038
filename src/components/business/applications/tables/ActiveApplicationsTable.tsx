
import { useState } from "react";
import { Application } from "@/types/business";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationCard } from "../ApplicationCard";

interface ActiveApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  handleStatusChange: (id: string, status: string) => void;
  isUpdatingStatus: string | null;
  openAcceptJobDialog: (application: Application) => void;
  handleAcceptJob: (application: JobApplication) => Promise<void>;
  isAcceptingJobLoading: boolean;
}

export const ActiveApplicationsTable = ({ 
  applications,
  openAcceptJobDialog,
}: ActiveApplicationsTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (applicationId: string) => {
    if (expandedId === applicationId) {
      setExpandedId(null);
    } else {
      setExpandedId(applicationId);
    }
  };

  return (
    <div className="space-y-4">
      {applications.map(application => (
        <ApplicationCard
          key={application.job_app_id}
          application={application}
          isExpanded={expandedId === application.job_app_id}
          toggleExpand={() => toggleExpand(application.job_app_id)}
          openAcceptJobDialog={openAcceptJobDialog}
        />
      ))}
    </div>
  );
};
