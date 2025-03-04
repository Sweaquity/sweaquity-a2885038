
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const PastApplicationsList = ({
  applications,
  onApplicationUpdated
}: PastApplicationsListProps) => {
  console.log("PastApplicationsList: Rendering with", applications.length, "applications");
  
  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No past applications found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <PastApplicationItem
          key={application.job_app_id}
          application={application}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </div>
  );
};
