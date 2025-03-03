
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const updateApplicationStatus = async (applicationId: string, status: string, reason?: string) => {
    try {
      setIsUpdatingStatus(applicationId);
      
      const updateData: { status: string; notes?: string } = { status };
      
      // Only include notes if a reason is provided
      if (reason) {
        updateData.notes = reason;
      }
      
      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);
        
      if (error) throw error;
      
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
