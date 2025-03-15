
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Check, Clock } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
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
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
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
  
  const handleLogTime = async () => {
    if (!application.task_id || hours <= 0) return;
    
    try {
      console.log("Logging time for task_id:", application.task_id);
      
      // Check if the task exists in project_sub_tasks first
      const { data: taskData, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('task_id')
        .eq('task_id', application.task_id)
        .single();
      
      if (taskError) {
        console.error("Error checking task existence:", taskError);
        toast.error("Could not find the associated task");
        return;
      }
      
      // Create a time entry
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: application.task_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });
      
      if (error) {
        console.error("Error inserting time entry:", error);
        throw error;
      }
      
      toast.success("Time logged successfully");
      setIsTimeLogDialogOpen(false);
      setHours(0);
      setDescription('');
      onApplicationUpdated();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    }
  };
  
  const showAcceptButton = application.status === 'accepted' && !application.accepted_jobseeker;
  const showTimeLogButton = application.accepted_jobseeker && application.accepted_business;

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
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMessageDialogOpen(true)}
              >
                Send Message
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewProject}
              >
                View Project
              </Button>
              
              {showTimeLogButton && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTimeLogDialogOpen(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setIsWithdrawDialogOpen(true)}
              >
                Withdraw
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
      
      <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time for {application.business_roles?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description of Work</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you accomplished during this time"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogTime} disabled={hours <= 0 || !description.trim()}>
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
