
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageSquare, ExternalLink, Clock, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { JobApplication } from '@/types/jobSeeker';
import { ApplicationHeader } from './ApplicationHeader';
import { ApplicationContent } from './ApplicationContent';
import { ApplicationSkills } from './ApplicationSkills';
import { CreateMessageDialog } from './CreateMessageDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { useWithdrawApplication } from './hooks/useWithdrawApplication';
import { useApplicationActions } from './hooks/useApplicationActions';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAcceptedJobs } from '@/hooks/useAcceptedJobs';
import { AcceptJobDialog } from './AcceptJobDialog';

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
    isWithdrawing,
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
  
  const showAcceptButton = application.status === 'accepted' && !application.accepted_jobseeker;

  return (
    <div className="border rounded-md overflow-hidden bg-card dashboard-card">
      {/* Top section */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {application.business_roles && (
            <ApplicationHeader 
              title={application.business_roles.title || "Untitled Role"}
              company={application.business_roles.company_name || "Unknown Company"}
              project={application.business_roles.project_title || ""}
              status={application.status}
            />
          )}
          
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            {compact ? (
              <StatusBadge status={application.status} />
            ) : (
              <div className="flex flex-col items-end space-y-2">
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  <Select 
                    value={String(application.status) || "pending"} 
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus === applicationId}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="withdrawn">Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {showAcceptButton && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAcceptJobDialogOpen(true)}
                      disabled={isAcceptingJob}
                    >
                      Accept Job
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpand}
                  className="flex items-center"
                >
                  {isExpanded ? (
                    <>
                      Less details <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      More details <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          {application.business_roles && (
            <ApplicationSkills
              skillRequirements={application.business_roles.skill_requirements || []}
              equityAllocation={application.business_roles.equity_allocation}
              timeframe={application.business_roles.timeframe}
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t p-4">
          {application.business_roles && (
            <ApplicationContent 
              description={application.business_roles.description || ""}
              message={application.message || ""}
              discourse={application.task_discourse}
              appliedAt={application.applied_at}
            />
          )}

          <div className="mt-4 card-actions">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCreateMessageOpen(true)}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/projects/${application.project_id}`, '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Project
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 w-full sm:w-auto"
              onClick={() => setIsWithdrawDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>
      )}

      <CreateMessageDialog
        isOpen={isCreateMessageOpen}
        onOpenChange={setIsCreateMessageOpen}
        applicationId={applicationId}
        existingMessage={application.task_discourse}
        onMessageSent={onApplicationUpdated}
      />

      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />
      
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status to "{selectedStatus}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdatingStatus === applicationId}>
              {isUpdatingStatus === applicationId ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
