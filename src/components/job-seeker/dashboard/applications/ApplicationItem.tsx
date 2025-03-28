
import { useState } from 'react';
import { JobApplication } from '@/types/applications';
import { CreateMessageDialog } from './CreateMessageDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { useWithdrawApplication } from './hooks/useWithdrawApplication';
import { useApplicationActions } from './hooks/useApplicationActions';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAcceptedJobs } from '@/hooks/useAcceptedJobs';
import { AcceptJobDialog } from './AcceptJobDialog';
import { Card } from '@/components/ui/card';
import { useNavigate } from "react-router-dom";
import { ApplicationItemHeader } from './components/ApplicationItemHeader';
import { ApplicationItemContent } from './components/ApplicationItemContent';

interface ApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated?: () => void;
  compact?: boolean;
}

export const ApplicationItem = ({ application, onApplicationUpdated, compact = false }: ApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateMessageOpen, setIsCreateMessageOpen] = useState(false);
  const [isAcceptJobDialogOpen, setIsAcceptJobDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const navigate = useNavigate();
  
  // Ensure we have a valid ID for our application
  const applicationId = application.job_app_id || application.id || `app-${Math.random()}`;
  
  const { 
    isWithdrawDialogOpen, 
    setIsWithdrawDialogOpen,
    handleWithdrawApplication 
  } = useWithdrawApplication(onApplicationUpdated);
  
  const { 
    isUpdatingStatus, 
    updateApplicationStatus 
  } = useApplicationActions(onApplicationUpdated);
  
  const {
    acceptJobAsJobSeeker,
    isLoading: isAcceptingJob
  } = useAcceptedJobs(onApplicationUpdated);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleWithdraw = async (reason?: string) => {
    await handleWithdrawApplication(applicationId, reason);
    return Promise.resolve();
  };
  
  const handleMessageSubmit = async (message: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to send messages");
        return;
      }

      // Get existing discourse
      const { data: applicationData, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Format the message with timestamp and sender
      const timestamp = new Date().toLocaleString();
      const formattedMessage = `[${timestamp}] Job Seeker: ${message}`;

      // Append to existing discourse or create new
      const updatedDiscourse = applicationData?.task_discourse
        ? `${applicationData.task_discourse}\n\n${formattedMessage}`
        : formattedMessage;

      // Update the application with the new discourse
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', applicationId);

      if (updateError) throw updateError;

      toast.success("Message sent successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };
  
  const handleStatusChange = (status: string) => {
    if (status === 'withdrawn') {
      setIsWithdrawDialogOpen(true);
      return;
    }
    
    setSelectedStatus(status);
    setStatusDialogOpen(true);
  };
  
  const confirmStatusChange = async () => {
    await updateApplicationStatus(applicationId, selectedStatus);
    setStatusDialogOpen(false);
  };
  
  const handleAcceptJob = async () => {
    await acceptJobAsJobSeeker(application);
    if (onApplicationUpdated) onApplicationUpdated();
  };

  const handleViewProject = () => {
    if (application.project_id && application.task_id) {
      navigate(`/seeker/dashboard?tab=live-projects&project=${application.project_id}&task=${application.task_id}`);
    }
  };
  
  const showAcceptButton = application.status === 'accepted' && !application.accepted_jobseeker;

  // Get title from either direct property or business_roles
  const taskTitle = application.task_title || 
                   (application.business_roles?.title || "Untitled Task");
                   
  const companyName = application.company_name || 
                     (application.business_roles?.company_name || 'Company');
                     
  const projectTitle = application.project_title || 
                      (application.business_roles?.project_title || 'Project');
  
  const description = application.description || application.business_roles?.description || "";

  return (
    <Card>
      <ApplicationItemHeader
        title={taskTitle}
        company={companyName}
        project={projectTitle}
        status={application.status}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus === applicationId}
        showAcceptButton={showAcceptButton}
        onAcceptClick={() => setIsAcceptJobDialogOpen(true)}
        isAcceptingJob={isAcceptingJob}
        compact={compact}
        date={application.applied_at}
      />
      
      {isExpanded && (
        <ApplicationItemContent
          description={description}
          message={application.message || ""}
          discourse={application.task_discourse || ""}
          appliedAt={application.applied_at || new Date().toISOString()}
          onViewProject={handleViewProject}
          onSendMessage={() => setIsCreateMessageOpen(true)}
          onWithdrawClick={showAcceptButton ? undefined : () => setIsWithdrawDialogOpen(true)}
        />
      )}
      
      <CreateMessageDialog
        isOpen={isCreateMessageOpen}
        onOpenChange={setIsCreateMessageOpen}
        onSendMessage={handleMessageSubmit}
        applicationId={applicationId}
      />
      
      <WithdrawDialog 
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
      />
      
      <AcceptJobDialog
        isOpen={isAcceptJobDialogOpen}
        onOpenChange={setIsAcceptJobDialogOpen}
        application={application}
        onAccept={handleAcceptJob}
        isLoading={isAcceptingJob}
      />
    </Card>
  );
};
