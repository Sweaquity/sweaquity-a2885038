
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
import { ProgressCircle } from "@/components/ui/progress-circle";

// Update the JobApplication interface in this file to include the missing properties
interface ExtendedJobApplication extends JobApplication {
  hours_logged?: number;
  business_roles?: {
    title?: string;
    description?: string;
    company_name?: string;
    project_title?: string;
    task_status?: string;
    timeframe?: string;
    equity_allocation?: number;
    skill_requirements?: Array<{ skill: string; level: string } | string>;
    completion_percentage?: number;
    estimated_hours?: number;
    project_id?: string;
  };
}

interface EquityProjectItemProps {
  application: ExtendedJobApplication;
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
    if (!application.job_app_id || hours <= 0) return;
    
    try {
      console.log("Logging time for job_app_id:", application.job_app_id);
      
      // First check if there's a ticket for this job application
      const { data: existingTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, project_id')
        .eq('job_app_id', application.job_app_id);
      
      if (ticketsError) {
        console.error("Error checking for existing tickets:", ticketsError);
        toast.error("Error checking ticket information");
        return;
      }
      
      let ticketId;
      
      if (existingTickets && existingTickets.length > 0) {
        // We found an existing ticket
        ticketId = existingTickets[0].id;
      } else {
        // Create a new ticket for this job application
        const currentUser = (await supabase.auth.getUser()).data.user?.id;
        const { data: newTicket, error: createError } = await supabase
          .from('tickets')
          .insert({
            title: `Work on ${application.business_roles?.title || 'task'}`,
            description: `Time tracking for ${application.business_roles?.project_title || 'project'}`,
            project_id: application.project_id,
            job_app_id: application.job_app_id,
            status: 'open',
            reporter: currentUser,
            priority: 'medium',
            health: 'good',
            assigned_to: currentUser
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error("Error creating ticket:", createError);
          toast.error("Could not create a ticket for time logging");
          return;
        }
        
        ticketId = newTicket.id;
      }
      
      // Now create the time entry with the valid ticket ID and job_app_id
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          job_app_id: application.job_app_id,
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

  const openTimeLogDialog = () => {
    setIsTimeLogDialogOpen(true);
  };

  const getTaskStatus = () => {
    return application.business_roles?.task_status || 'pending';
  };

  const getCompletionPercentage = () => {
    return application.business_roles?.completion_percentage || 0;
  };

  // Calculate hours logged
  const getHoursLogged = () => {
    return application.hours_logged || 0;
  };

  // Calculate equity earned based on completion percentage or hours logged
  const getEquityEarned = () => {
    const equity = application.business_roles?.equity_allocation || 0;
    const completion = getCompletionPercentage();
    const hoursLogged = getHoursLogged();
    const estimatedHours = application.business_roles?.estimated_hours || 0;
    
    if (estimatedHours > 0 && hoursLogged > 0) {
      return (hoursLogged / estimatedHours) * equity;
    } else if (completion > 0) {
      return (completion / 100) * equity;
    }
    
    return 0;
  };

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
            <div className="flex items-center gap-1">
              <ProgressCircle 
                value={getCompletionPercentage()} 
                size="sm" 
                showRing={false} 
                className="h-8 w-8" 
              />
              <div className="text-xs text-muted-foreground">
                <div>{getHoursLogged()}h logged</div>
                <div>{getEquityEarned().toFixed(2)}% earned</div>
              </div>
            </div>
            
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
            taskStatus={getTaskStatus()}
            timeframe={application.business_roles?.timeframe}
            equityAllocation={application.business_roles?.equity_allocation}
            skillRequirements={application.business_roles?.skill_requirements}
          />
          
          <CollapsibleContent className="mt-4 space-y-4">
            <ProjectDetails 
              description={application.business_roles?.description}
              taskDiscourse={application.task_discourse}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Task Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Hours:</span>
                    <span>{application.business_roles?.estimated_hours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours Logged:</span>
                    <span>{getHoursLogged()}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion:</span>
                    <span>{getCompletionPercentage()}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equity Allocated:</span>
                    <span>{application.business_roles?.equity_allocation || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equity Earned:</span>
                    <span>{getEquityEarned().toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Actions</h3>
                <div className="flex flex-wrap gap-2">
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
                      onClick={openTimeLogDialog}
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
              </div>
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
        <DialogContent className="sm:max-w-md">
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
                value={hours || ''}
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
