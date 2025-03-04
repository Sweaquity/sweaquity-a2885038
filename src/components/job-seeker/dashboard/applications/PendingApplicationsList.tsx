
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { PendingApplicationItem } from "./PendingApplicationItem";
import { EmptyState } from "../opportunities/EmptyState";
import { useUserSkills } from "./hooks/useUserSkills";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const PendingApplicationsList = ({ 
  applications, 
  onApplicationUpdated 
}: PendingApplicationsListProps) => {
  const [filter, setFilter] = useState<string>("all");
  const { getMatchedSkills } = useUserSkills();
  
  const filteredApplications = applications.filter(app => {
    if (filter === "all") return true;
    
    // Use the status from the application directly, ensuring it exists and is a string
    const status = app.status && typeof app.status === 'string' 
      ? app.status.toLowerCase() 
      : '';
    
    return status === filter.toLowerCase();
  });

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No Pending Applications"
        description="You haven't applied to any projects yet. Explore available projects to find opportunities that match your skills."
        actionText="Find Projects"
        actionLink="/seeker/dashboard/opportunities"
      />
    );
  }

  const pendingCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'pending'
  ).length;
  
  const inReviewCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'in review'
  ).length;
  
  const negotiationCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'negotiation'
  ).length;
  
  const acceptedCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'accepted'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          All ({applications.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "pending"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("in review")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "in review"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          In Review ({inReviewCount})
        </button>
        <button
          onClick={() => setFilter("negotiation")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "negotiation"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Negotiation ({negotiationCount})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "accepted"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Accepted ({acceptedCount})
        </button>
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <PendingApplicationItem
            key={application.job_app_id}
            application={application}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No applications found with the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
