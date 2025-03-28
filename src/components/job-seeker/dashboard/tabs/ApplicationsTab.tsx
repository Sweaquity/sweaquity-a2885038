
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationsTabBase } from "@/components/job-seeker/dashboard/applications";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsTab = ({
  applications,
  onApplicationUpdated,
}: ApplicationsTabProps) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const channelRef = useRef<any>(null);

  // Calculate new applications that need attention (accepted jobs that need jobseeker acceptance)
  useEffect(() => {
    const pendingAcceptance = applications.filter(app => 
      app.status === 'accepted' && app.accepted_business && !app.accepted_jobseeker
    ).length;
    
    setNewApplicationsCount(pendingAcceptance);
  }, [applications]);

  // Memoize the update function to prevent unnecessary re-renders
  const handleApplicationUpdated = useCallback(() => {
    setNewMessagesCount(prev => prev + 1);
    onApplicationUpdated();
  }, [onApplicationUpdated]);

  useEffect(() => {
    // Only create the channel if it doesn't exist yet
    if (!channelRef.current) {
      channelRef.current = supabase
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
    }

    // Cleanup function to remove the Supabase subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []); // Empty dependency array to ensure this only runs once

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
