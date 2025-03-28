
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PendingApplicationItemProps } from "@/types/applications";
import { WithdrawDialog } from "./WithdrawDialog";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ApplicationItemHeader } from "./components/ApplicationItemHeader";
import { ApplicationItemContent } from "./components/ApplicationItemContent";

export const PendingApplicationItem = ({
  application,
  onAccept,
  onWithdraw,
  isWithdrawing,
  getMatchedSkills
}: PendingApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateMessageOpen, setIsCreateMessageOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const navigate = useNavigate();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleWithdraw = async (reason?: string) => {
    if (onWithdraw) {
      await onWithdraw(application.job_app_id || application.id || "", reason);
    }
  };

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(application);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      // Get existing discourse
      const { data: applicationData, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', application.job_app_id || application.id)
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
        .eq('job_app_id', application.job_app_id || application.id);

      if (updateError) throw updateError;

      toast.success("Message sent successfully");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  const handleViewProject = () => {
    if (application.project_id && application.task_id) {
      navigate(`/seeker/dashboard?tab=live-projects&project=${application.project_id}&task=${application.task_id}`);
    }
  };

  const taskTitle = application.business_roles?.title || "Untitled Task";
  const companyName = application.business_roles?.company_name || "Company";
  const projectTitle = application.business_roles?.project_title || "Project";
  const description = application.business_roles?.description || "";
  const showAcceptButton = application.status === 'accepted' && application.accepted_business && !application.accepted_jobseeker;

  return (
    <Card>
      <ApplicationItemHeader
        title={taskTitle}
        company={companyName}
        project={projectTitle}
        status={application.status}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        showAcceptButton={showAcceptButton}
        onAcceptClick={handleAccept}
        isAcceptingJob={false}
        date={application.applied_at}
      />
      
      {isExpanded && (
        <ApplicationItemContent
          description={description}
          message={application.message}
          discourse={application.task_discourse}
          appliedAt={application.applied_at}
          onViewProject={handleViewProject}
          onSendMessage={() => setIsCreateMessageOpen(true)}
          onWithdrawClick={() => setIsWithdrawDialogOpen(true)}
        />
      )}
      
      <WithdrawDialog 
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
      />
      
      <CreateMessageDialog
        isOpen={isCreateMessageOpen}
        onOpenChange={setIsCreateMessageOpen}
        onSendMessage={handleSendMessage}
        applicationId={application.job_app_id || application.id || ""}
      />
    </Card>
  );
};
