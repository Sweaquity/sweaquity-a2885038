
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { JobApplication } from '@/types/jobSeeker';

export const useAcceptedJobs = (onUpdateCallback?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);

  const acceptJobAsJobSeeker = async (application: JobApplication) => {
    try {
      setIsLoading(true);
      
      // First update the job application status
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'accepted',
          accepted_jobseeker: true 
        })
        .eq('job_app_id', application.job_app_id);
      
      if (updateError) throw updateError;
      
      // Check if there's already an accepted_jobs record
      const { data: existingData, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('*')
        .eq('job_app_id', application.job_app_id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (!existingData) {
        // Create a new accepted_jobs record
        const { error: insertError } = await supabase
          .from('accepted_jobs')
          .insert({
            job_app_id: application.job_app_id,
            date_accepted: new Date().toISOString(),
            equity_agreed: application.business_roles?.equity_allocation || 0
          });
        
        if (insertError) throw insertError;
      }
      
      toast.success('Job accepted successfully');
      
      if (onUpdateCallback) {
        onUpdateCallback();
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error('Failed to accept job');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    acceptJobAsJobSeeker,
    isLoading
  };
};
