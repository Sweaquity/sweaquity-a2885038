
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";
import { EmptyState } from "../opportunities/EmptyState";
import { useUserSkills } from "./hooks/useUserSkills";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const PastApplicationsList = ({ 
  applications, 
  onApplicationUpdated 
}: PastApplicationsListProps) => {
  const [filter, setFilter] = useState<string>("all");
  const { getMatchedSkills } = useUserSkills();
  
  // Only log once during component rendering, not in render loop
  console.log("Past applications:", applications);
  
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
      <div className="text-center">
        <h3 className="text-lg font-medium">No Past Applications</h3>
        <p className="text-muted-foreground mt-1">
          You don't have any withdrawn or rejected applications yet.
        </p>
        <div className="mt-4">
          <a 
            href="/seeker/dashboard/opportunities" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Find Projects
          </a>
        </div>
      </div>
    );
  }

  const withdrawnCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'withdrawn'
  ).length;
  
  const rejectedCount = applications.filter(app => 
    app.status && app.status.toLowerCase() === 'rejected'
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
          onClick={() => setFilter("withdrawn")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "withdrawn"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Withdrawn ({withdrawnCount})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            filter === "rejected"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <PastApplicationItem
            key={application.job_app_id}
            application={application}
            getMatchedSkills={() => getMatchedSkills(application)}
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
