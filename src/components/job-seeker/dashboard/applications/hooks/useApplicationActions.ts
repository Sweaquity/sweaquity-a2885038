
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onSuccess?: () => void) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  const updateApplicationStatus = async (applicationId: string, newStatus: string, rejectionNote?: string) => {
    try {
      setIsUpdatingStatus(applicationId);

      let updateData: any = { status: newStatus };
      
      // If there's a rejection note, store it in notes field
      if (rejectionNote && newStatus === 'rejected') {
        updateData.notes = rejectionNote;
      }

      // If status is 'accepted', check if we need to update accepted_jobseeker or accepted_business
      if (newStatus === 'accepted') {
        // Get session to determine if this is a jobseeker or business
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if this user is the job applicant
          const { data: applicantData } = await supabase
            .from('job_applications')
            .select('user_id')
            .eq('job_app_id', applicationId)
            .single();
            
          if (applicantData) {
            // If the current user is the job seeker who applied
            if (applicantData.user_id === session.user.id) {
              updateData.accepted_jobseeker = true;
            } else {
              // Otherwise it's the business accepting
              updateData.accepted_business = true;
            }
          }
        }
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success(`Application ${newStatus.toLowerCase()}`);
      
      // Check if both jobseeker and business have accepted
      if (newStatus === 'accepted') {
        const { data: appData } = await supabase
          .from('job_applications')
          .select('accepted_jobseeker, accepted_business')
          .eq('job_app_id', applicationId)
          .single();
          
        if (appData && appData.accepted_jobseeker && appData.accepted_business) {
          // Both parties have accepted, create accepted_jobs entry
          await createAcceptedJobEntry(applicationId);
        }
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error(error.message || "Failed to update application status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const createAcceptedJobEntry = async (applicationId: string) => {
    try {
      // Get the application data including equity allocation
      const { data: applicationData, error: appError } = await supabase
        .from('job_applications')
        .select(`
          task_id,
          project_sub_tasks(equity_allocation)
        `)
        .eq('job_app_id', applicationId)
        .single();
        
      if (appError) throw appError;
      
      // Fixed: Properly access equity_allocation from the nested object
      let equityAllocation = 0;
      if (applicationData && 
          applicationData.project_sub_tasks && 
          typeof applicationData.project_sub_tasks === 'object') {
        // If it's an array with one item
        if (Array.isArray(applicationData.project_sub_tasks) && applicationData.project_sub_tasks.length > 0) {
          equityAllocation = applicationData.project_sub_tasks[0].equity_allocation || 0;
        } 
        // If it's a direct object (not array)
        else if ('equity_allocation' in applicationData.project_sub_tasks) {
          equityAllocation = applicationData.project_sub_tasks.equity_allocation || 0;
        }
      }
      
      // Check if an entry already exists
      const { data: existingEntry } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', applicationId)
        .single();
        
      if (existingEntry) {
        console.log('Accepted job entry already exists');
        return;
      }
      
      // Create a new entry in accepted_jobs
      const { error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: applicationId,
          equity_agreed: equityAllocation
        });
      
      if (error) throw error;
      
      toast.success("Agreement created successfully");
    } catch (error) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement");
    }
  };

  const withdrawApplication = async (applicationId: string, withdrawalReason?: string) => {
    try {
      setIsWithdrawing(applicationId);

      let updateData: any = { status: 'withdrawn' };
      
      // If there's a withdrawal reason, store it in the notes field
      if (withdrawalReason) {
        updateData.notes = withdrawalReason;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      if (onSuccess) onSuccess();
      
      return true;
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error.message || "Failed to withdraw application");
      return false;
    } finally {
      setIsWithdrawing(null);
    }
  };

  return {
    isUpdatingStatus,
    isWithdrawing,
    updateApplicationStatus,
    withdrawApplication
  };
};
