
import { ApplicationsTab as ApplicationsTabComponent } from "@/components/job-seeker/dashboard/applications";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationsTabComponentProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsTabComponent = ({
  applications,
  onApplicationUpdated,
}: ApplicationsTabComponentProps) => {
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
    <div>
      <h2>Job Applications</h2>
      <p>New messages: {newMessagesCount}</p>
      <ul>
        {applications.map(application => (
          <li key={application.id}>{application.jobTitle}</li>
        ))}
      </ul>
    </div>
  );
};
