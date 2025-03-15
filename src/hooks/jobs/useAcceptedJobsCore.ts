
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";

export interface AcceptedJob {
  id: string;
  job_app_id: string;
  date_accepted: string;
  document_url: string | null;
  accepted_discourse: string | null;
  equity_agreed: number;
}

export const useAcceptedJobsCore = (onUpdate?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  
  // Load any existing accepted jobs on mount
  useEffect(() => {
    fetchAcceptedJobs();
  }, []);
  
  // Fetch current user's accepted jobs
  const fetchAcceptedJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('accepted_jobs')
        .select('*, job_applications(user_id, project_id, task_id)')
        .eq('job_applications.user_id', session.user.id);
        
      if (error) throw error;
      
      setAcceptedJobs(data || []);
    } catch (error) {
      console.error("Error fetching accepted jobs:", error);
    }
  };
  
  // Create a new accepted job entry when both parties have accepted
  const createAcceptedJobEntry = async (application: JobApplication) => {
    try {
      console.log("Creating accepted job entry for application:", application);
      setIsLoading(true);
      
      // Check if an entry already exists
      const { data: existingEntry, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', application.job_app_id)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing entry:", checkError);
        throw checkError;
      }
      
      if (existingEntry) {
        console.log("Entry already exists for this application", existingEntry);
        return existingEntry;
      }
      
      // Get equity allocation from business_roles
      let equityAllocation = 0;
      if (application.business_roles?.equity_allocation) {
        equityAllocation = application.business_roles.equity_allocation;
      }
      
      console.log("Creating new accepted job with equity allocation:", equityAllocation);
      
      const { data, error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          equity_agreed: equityAllocation,
          date_accepted: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error inserting accepted job:", error);
        throw error;
      }
      
      console.log("Successfully created accepted job:", data);
      toast.success("Agreement created successfully");
      
      if (onUpdate) onUpdate();
      return data;
    } catch (error) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get a specific accepted job by job application ID
  const getAcceptedJob = async (jobAppId: string): Promise<AcceptedJob | null> => {
    try {
      const { data, error } = await supabase
        .from('accepted_jobs')
        .select('*')
        .eq('job_app_id', jobAppId)
        .maybeSingle();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error fetching accepted job:", error);
      return null;
    }
  };
  
  // Check for job applications that should have an accepted_jobs entry but don't
  // This is a utility to help fix any inconsistencies in the database
  const syncMissingAcceptedJobs = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Find applications where both parties have accepted but no accepted_jobs entry exists
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          status,
          accepted_business,
          accepted_jobseeker,
          business_roles:project_sub_tasks (
            title,
            description,
            timeframe,
            equity_allocation
          )
        `)
        .eq('user_id', session.user.id)
        .eq('accepted_business', true)
        .eq('accepted_jobseeker', true);
        
      if (error) throw error;
      
      if (!applications?.length) {
        console.log("No applications found needing accepted_jobs entries");
        return;
      }
      
      // Check which applications don't have an accepted_jobs entry
      for (const app of applications) {
        const { data: existingEntry } = await supabase
          .from('accepted_jobs')
          .select('id')
          .eq('job_app_id', app.job_app_id)
          .maybeSingle();
          
        if (!existingEntry) {
          console.log("Creating missing accepted_jobs entry for:", app.job_app_id);
          await createAcceptedJobEntry(app as unknown as JobApplication);
        }
      }
      
      toast.success("Synchronized accepted jobs successfully");
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error("Error syncing accepted jobs:", error);
      toast.error("Failed to synchronize accepted jobs");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Log effort (time) for an accepted job
  const logJobEffort = async (
    jobAppId: string, 
    hours: number, 
    description: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // First, check if this application has an accepted_jobs entry
      const acceptedJob = await getAcceptedJob(jobAppId);
      
      if (!acceptedJob) {
        console.error("No accepted job found for application:", jobAppId);
        toast.error("Cannot log time - job has not been accepted by both parties");
        return false;
      }
      
      // Get the job application to find the task_id
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('task_id, project_id')
        .eq('job_app_id', jobAppId)
        .single();
        
      if (appError) {
        console.error("Error fetching job application:", appError);
        throw appError;
      }
      
      // Create a time entry
      const { error: timeError } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: application.task_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          hours_logged: hours,
          description: description,
          start_time: new Date().toISOString()
        });
        
      if (timeError) {
        console.error("Error logging time:", timeError);
        throw timeError;
      }
      
      toast.success("Time logged successfully");
      if (onUpdate) onUpdate();
      return true;
      
    } catch (error) {
      console.error("Error logging job effort:", error);
      toast.error("Failed to log time");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    acceptedJobs,
    createAcceptedJobEntry,
    getAcceptedJob,
    syncMissingAcceptedJobs,
    logJobEffort
  };
};
