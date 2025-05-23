
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const updateApplicationStatus = async (applicationId: string, status: string, reason?: string) => {
    try {
      // Validate status to ensure it's never empty
      if (!status || status.trim() === '') {
        console.error('Attempted to update with empty status');
        toast.error("Cannot update with an empty status value");
        return;
      }
      
      setIsUpdatingStatus(applicationId);
      
      const updateData: { status: string; notes?: string } = { status };
      
      // Only include notes if a reason is provided
      if (reason) {
        updateData.notes = reason;
      }
      
      // Log for debugging
      console.log(`Updating application ${applicationId} to status: ${status}${reason ? ` with reason: ${reason}` : ''}`);
      
      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);
        
      if (error) {
        console.error('Error in Supabase update:', error);
        throw error;
      }
      
      toast.success(`Application ${status === 'withdrawn' ? 'withdrawn' : 'status updated'} successfully`);
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error("Failed to update application status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return {
    isUpdatingStatus,
    updateApplicationStatus
  };
};
