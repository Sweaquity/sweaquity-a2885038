
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ApplicationItemHeader } from "./components/ApplicationItemHeader";
import { ApplicationItemContent } from "./components/ApplicationItemContent";

interface EquityProjectItemProps {
  application: JobApplication;
  onApplicationUpdated?: () => void;
  isCompleted?: boolean;
}

export const EquityProjectItem = ({ 
  application, 
  onApplicationUpdated = () => {},
  isCompleted = false
}: EquityProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateMessageOpen, setIsCreateMessageOpen] = useState(false);
  const navigate = useNavigate();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSendMessage = async (message: string) => {
    try {
      // Get existing discourse
      const { data: applicationData, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', application.job_app_id)
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
        .eq('job_app_id', application.job_app_id);

      if (updateError) throw updateError;

      toast.success("Message sent successfully");
      onApplicationUpdated();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  const handleViewProject = () => {
    navigate(`/seeker/dashboard?tab=live-projects&project=${application.project_id}&task=${application.task_id}`);
  };

  // Calculate equity progress
  const equityAgreed = application.accepted_jobs?.equity_agreed || 0;
  const equityAllocated = application.accepted_jobs?.jobs_equity_allocated || 0;
  const progressPercentage = equityAgreed > 0 ? (equityAllocated / equityAgreed) * 100 : 0;

  // Format dates
  const dateAccepted = application.accepted_jobs?.date_accepted 
    ? formatDistanceToNow(new Date(application.accepted_jobs.date_accepted), { addSuffix: true })
    : "recently";

  const appliedAt = application.applied_at 
    ? formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })
    : "recently";

  const taskTitle = application.business_roles?.title || "Untitled Task";
  const companyName = application.business_roles?.company_name || "Company";
  const projectTitle = application.business_roles?.project_title || "Project";
  const description = application.business_roles?.description || "";

  return (
    <Card>
      <ApplicationItemHeader
        title={taskTitle}
        company={companyName}
        project={projectTitle}
        status={application.status}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        date={appliedAt}
      />
      
      {isExpanded && (
        <CardContent className="pt-0">
          <ApplicationItemContent
            description={description}
            message={application.message}
            discourse={application.task_discourse}
            appliedAt={application.applied_at}
            onViewProject={handleViewProject}
            onSendMessage={() => setIsCreateMessageOpen(true)}
          />
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Equity Progress</span>
              <Badge variant={isCompleted ? "success" : "outline"}>
                {isCompleted ? "Completed" : "In Progress"}
              </Badge>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{equityAllocated.toFixed(2)}%</span>
              <span>{equityAgreed.toFixed(2)}%</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span>Project accepted {dateAccepted}</span>
            </div>
          </div>
        </CardContent>
      )}
      
      <CreateMessageDialog
        isOpen={isCreateMessageOpen}
        onOpenChange={setIsCreateMessageOpen}
        onSendMessage={handleSendMessage}
        applicationId={application.job_app_id}
      />
    </Card>
  );
};
