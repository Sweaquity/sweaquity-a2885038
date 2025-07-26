
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
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ApplicationItemContentProps } from '@/types/dashboardProps';
import { convertApplicationToJobApplication } from '@/utils/applicationUtils';

// Simple components for structure
const ApplicationItemHeader = ({ 
  title, 
  company, 
  project, 
  status, 
  isExpanded, 
  toggleExpand,
  onStatusChange,
  isUpdatingStatus,
  showAcceptButton,
  onAcceptClick
}: any) => (
  <div className="p-4 flex justify-between items-center border-b">
    <div className="flex-1">
      <h3 className="font-medium text-base">{title}</h3>
      <p className="text-sm text-muted-foreground">
        {company}
        {project && ` • ${project}`}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <StatusBadge status={status} isUpdating={isUpdatingStatus} />
      {showAcceptButton && (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onAcceptClick();
          }}
        >
          Accept
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-1" 
        onClick={toggleExpand}
      >
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </Button>
    </div>
  </div>
);

const ApplicationItemContent = ({ 
  description, 
  message, 
  discourse, 
  appliedAt
}: ApplicationItemContentProps) => (
  <div className="p-4 space-y-4">
    {description && (
      <div>
        <h4 className="text-sm font-medium mb-1">Role Description</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    )}
    
    {message && (
      <div>
        <h4 className="text-sm font-medium mb-1">Your Message</h4>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )}
    
    {discourse && (
      <div>
        <h4 className="text-sm font-medium mb-1">Message History</h4>
        <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
          {discourse}
        </div>
      </div>
    )}
    
    <div className="text-xs text-muted-foreground">
      Applied {formatDistanceToNow(new Date(appliedAt || Date.now()), { addSuffix: true })}
    </div>
  </div>
);

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
    // Convert application to jobSeeker.JobApplication if it's not already
    const jobSeekerApplication = application;
    
    await acceptJobAsJobSeeker(jobSeekerApplication);
    if (onApplicationUpdated) onApplicationUpdated();
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
  
  // If applied_at is missing, use created_at or current date
  const appliedAt = application.applied_at || application.created_at || new Date().toISOString();

  return (
    <div className="border rounded-md overflow-hidden bg-card dashboard-card">
      {/* Application Header Section */}
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
      />
      
      {/* Application Content Section - shown when expanded */}
      {isExpanded && (
        <ApplicationItemContent
          description={description}
          message={application.message || ""}
          discourse={application.task_discourse || ""}
          appliedAt={appliedAt}
        />
      )}
      
      {/* Action Footer - always shown */}
      <div className="p-3 flex justify-end border-t bg-muted/30">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsCreateMessageOpen(true)}
          className="flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          Send Message
        </Button>
      </div>
      
      {/* Dialog components */}
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
    </div>
  );
};
