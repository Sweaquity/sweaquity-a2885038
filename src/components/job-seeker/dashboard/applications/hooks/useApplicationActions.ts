
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useApplicationActions = (onUpdateCallback?: () => void) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      setIsUpdatingStatus(applicationId);
      
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success(`Application ${status}`);
      
      if (onUpdateCallback) {
        onUpdateCallback();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };
  
  const handleWithdrawApplication = async (applicationId: string, reason?: string) => {
    try {
      setIsUpdatingStatus(applicationId);
      
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          message: reason ? `${reason}\n\nWithdrawn on: ${new Date().toLocaleString()}` : undefined
        })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success('Application withdrawn');
      
      if (onUpdateCallback) {
        onUpdateCallback();
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return {
    isUpdatingStatus,
    updateApplicationStatus,
    handleWithdrawApplication,
  };
};
