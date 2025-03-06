
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { 
  ProjectActions, 
  ProjectInfo, 
  ProjectDetails, 
  ProjectHeader, 
  StatusChangeDialog 
} from "./components";

interface EquityProjectItemProps {
  application: JobApplication;
  onMessageSent?: () => void;
  onApplicationUpdated?: () => void;
}

export const EquityProjectItem = ({ 
  application,
  onMessageSent,
  onApplicationUpdated = () => {}
}: EquityProjectItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isAcceptJobDialogOpen, setIsAcceptJobDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const navigate = useNavigate();

  const { 
    isUpdatingStatus, 
    updateApplicationStatus 
  } = useApplicationActions(onApplicationUpdated);
  
  const {
    acceptJobAsJobSeeker,
    isLoading: isAcceptingJob
  } = useAcceptedJobs(onApplicationUpdated);

  const handleViewProject = () => {
    if (application.project_id) {
      navigate(`/projects/${application.project_id}`);
    }
  };

  const handleAcceptJob = async () => {
    await acceptJobAsJobSeeker(application);
    onApplicationUpdated();
  };

  const handleWithdraw = async (reason?: string) => {
    try {
      await updateApplicationStatus(application.job_app_id, 'withdrawn', reason);
      toast.success("Application withdrawn successfully");
      onApplicationUpdated();
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    }
  };

  const handleStatusChange = (status: string) => {
    if (status === 'withdrawn') {
      setIsWithdrawDialogOpen(true);
      return;
    }
    
    setSelectedStatus(status);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    await updateApplicationStatus(application.job_app_id, selectedStatus);
    setIsStatusDialogOpen(false);
  };
  
  const showAcceptButton = application.status === 'accepted' && !application.accepted_jobseeker;

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <ProjectHeader 
            title={application.business_roles?.title}
            companyName={application.business_roles?.company_name}
            projectTitle={application.business_roles?.project_title}
            status={application.status}
            appliedAt={application.applied_at}
          />
          
          <div className="flex items-center gap-2">
            <Select 
              value={application.status} 
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus === application.job_app_id}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
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
                <Check className="mr-1.5 h-4 w-4" />
                Accept Job
              </Button>
            )}
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 py-2">
          <ProjectInfo 
            taskStatus={application.business_roles?.task_status}
            timeframe={application.business_roles?.timeframe}
            equityAllocation={application.business_roles?.equity_allocation}
            skillRequirements={application.business_roles?.skill_requirements}
          />
          
          <CollapsibleContent className="mt-4 space-y-4">
            <ProjectDetails 
              description={application.business_roles?.description}
              taskDiscourse={application.task_discourse}
            />
            
            <ProjectActions 
              onMessageClick={() => setIsMessageDialogOpen(true)}
              onViewProjectClick={handleViewProject}
            />
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
      
      <CreateMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        applicationId={application.job_app_id}
        existingMessage={application.task_discourse}
        onMessageSent={() => {
          if (onMessageSent) onMessageSent();
          onApplicationUpdated();
        }}
      />
      
      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
        isWithdrawing={isUpdatingStatus === application.job_app_id}
      />
      
      <StatusChangeDialog
        isOpen={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        selectedStatus={selectedStatus}
        onConfirm={confirmStatusChange}
        isLoading={isUpdatingStatus === application.job_app_id}
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
