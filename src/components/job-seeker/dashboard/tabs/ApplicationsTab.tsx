// File: src/components/job-seeker/dashboard/tabs/ApplicationsTab.tsx

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
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const channelRef = useRef<any>(null);

  // Count new applications and messages
  useEffect(() => {
    const pendingApps = applications.filter(app => 
      app.status === 'pending' || 
      app.status === 'accepted' || 
      app.status === 'negotiation'
    );
    setNewApplicationsCount(pendingApps.length);

    const hasNewMessages = applications.some(app => 
      app.task_discourse && 
      !app.task_discourse.includes('read')
    );
    setNewMessagesCount(hasNewMessages ? 1 : 0);
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
        newApplicationsCount={newApplicationsCount}
      />
    </div>
  );
};
