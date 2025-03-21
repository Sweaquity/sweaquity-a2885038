
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
  
  const createAcceptedJobEntry = async (application: JobApplication) => {
    try {
      console.log("Creating accepted job entry for application:", application.job_app_id);
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
      
      // Make sure we have the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }
      
      // Insert directly without filtering fields
      const { data, error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          equity_agreed: equityAllocation,
          date_accepted: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (error) {
        console.error("Error inserting accepted job:", error);
        throw error;
      }
      
      // Also create a ticket for this accepted job for tracking purposes
      if (application.task_id && application.project_id) {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: `Work on ${application.business_roles?.title || 'task'}`,
            description: `Accepted job: ${application.business_roles?.description || 'No description'}`,
            project_id: application.project_id,
            status: 'open',
            priority: 'medium',
            health: 'good',
            reporter: session.user.id,
            assigned_to: session.user.id,
            task_id: application.task_id,
            job_app_id: application.job_app_id, // Add the job_app_id reference
            estimated_hours: 0,
            equity_points: equityAllocation
          })
          .select('id')
          .single();
          
        if (ticketError) {
          console.error("Error creating ticket for accepted job:", ticketError);
          // Don't throw here, we still created the accepted job
        } else {
          console.log("Created ticket for accepted job:", ticketData);
        }
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

  const getTicketsForAcceptedJob = async (jobAppId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('job_app_id', jobAppId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching tickets for accepted job:", error);
      return [];
    }
  };
  
  return {
    isLoading,
    setIsLoading,
    createAcceptedJobEntry,
    getAcceptedJob,
    getTicketsForAcceptedJob
  };
};
