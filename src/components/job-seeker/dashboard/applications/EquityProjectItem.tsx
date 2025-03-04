
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ChevronDown, ChevronUp, ExternalLink, Clock, Check } from "lucide-react";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { useApplicationActions } from "./hooks/useApplicationActions";

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'negotiation':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

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
          <div className="flex flex-1 flex-col space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-md font-semibold line-clamp-1">
                {application.business_roles?.title || "Untitled Role"}
              </h3>
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                {application.business_roles?.company_name || "Unknown company"}
              </span>
              <span className="inline-flex items-center">
                Project: {application.business_roles?.project_title || "Untitled Project"}
              </span>
              <span className="inline-flex items-center">
                Applied: {formatDate(application.applied_at)}
              </span>
            </div>
          </div>
          
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 text-sm">
            <div>
              <p className="text-muted-foreground">Task Status</p>
              <p>{application.business_roles?.task_status || "Pending"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeframe</p>
              <p>{application.business_roles?.timeframe || "Not specified"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Equity Allocation</p>
              <p>{application.business_roles?.equity_allocation}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-2 text-sm">
            <div>
              <p className="text-muted-foreground">Skills Required</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {application.business_roles?.skill_requirements?.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-slate-50">
                    {typeof skill === 'string' ? skill : skill.skill}
                    {typeof skill !== 'string' && skill.level && 
                      <span className="ml-1 opacity-70">({skill.level})</span>
                    }
                  </Badge>
                ))}
                {(!application.business_roles?.skill_requirements || 
                  application.business_roles.skill_requirements.length === 0) && 
                  <span className="text-muted-foreground">No specific skills required</span>
                }
              </div>
            </div>
          </div>
          
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium mb-1">Project Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {application.business_roles?.description || "No description provided."}
              </p>
            </div>
            
            {application.task_discourse && (
              <div className="mt-3 p-3 bg-slate-50 rounded-md border">
                <h4 className="font-medium mb-2">Message History</h4>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {application.task_discourse}
                </pre>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsMessageDialogOpen(true)}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Create Message
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewProject}
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                View Project
              </Button>
            </div>
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
      
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status to "{selectedStatus}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdatingStatus === application.job_app_id}>
              {isUpdatingStatus === application.job_app_id ? (
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
    </Card>
  );
};
