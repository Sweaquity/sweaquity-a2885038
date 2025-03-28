import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ApplicationsTabBase } from '../applications/ApplicationsTabBase';
import { JobApplication } from '@/types/interfaces';
import { adaptJobApplications } from '@/utils/typeAdapters';

interface ApplicationsTabProps {
  userId: string;
  viewJobDetails: (jobAppId: string) => void;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ userId, viewJobDetails }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleWithdrawApplication = async (applicationId: string, reason: string = '') => {
    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn', message: reason })
        .eq('id', applicationId);

      if (error) {
        console.error('Error withdrawing application:', error);
        return;
      }

      fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAcceptApplication = async (application: JobApplication) => {
    try {
      // Update the job application status to 'accepted'
      const { data: updatedApplication, error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error accepting application:", updateError);
        return;
      }

      // Refresh applications
      fetchApplications();
    } catch (error) {
      console.error("Error accepting application:", error);
    }
  };

  return (
    <ApplicationsTabBase
      applications={adaptJobApplications(applications)}
      onWithdrawApplication={handleWithdrawApplication}
      onAcceptApplication={handleAcceptApplication}
      viewJobDetails={viewJobDetails}
      isWithdrawing={isWithdrawing}
      onApplicationUpdated={fetchApplications}
    />
  );
};
