// File: src/components/job-seeker/dashboard/tabs/ApplicationsTab.tsx

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";
// Import the base ApplicationsTab component - note the change to path/naming
import { ApplicationsTabBase } from "@/components/job-seeker/dashboard/applications/ApplicationsTabBase";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsTab = ({
  applications,
  onApplicationUpdated,
}: ApplicationsTabProps) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Memoize the update function to prevent unnecessary re-renders
  const handleApplicationUpdated = useCallback(() => {
    setNewMessagesCount(prev => prev + 1);
    onApplicationUpdated();
  }, [onApplicationUpdated]);

  useEffect(() => {
    const channel = supabase
      .channel("job-seeker-apps")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_applications",
          filter: "task_discourse=neq.null",
        },
        () => {
          setNewMessagesCount(prev => prev + 1);
          handleApplicationUpdated();
        }
      )
      .subscribe();

    // Cleanup function to remove the Supabase subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleApplicationUpdated]); // Only re-run if the update function changes

  return (
    <div className="space-y-6">
      <ApplicationsTabBase 
        applications={applications} 
        onApplicationUpdated={handleApplicationUpdated}
        newMessagesCount={newMessagesCount}
      />
    </div>
  );
};
