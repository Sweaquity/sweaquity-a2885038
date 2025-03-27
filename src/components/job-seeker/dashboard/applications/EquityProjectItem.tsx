
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { EquityProject, JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { ProjectInfo } from "./components/ProjectInfo";

interface EquityProjectItemProps {
  project: EquityProject;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export const EquityProjectItem = ({
  project,
  onWithdraw,
  onAccept,
  isWithdrawing = false
}: EquityProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [hoursLogged, setHoursLogged] = useState(0);
  const [agreedEquity, setAgreedEquity] = useState<number | null>(null);
  const [jobsEquityAllocated, setJobsEquityAllocated] = useState<number | null>(null);
  const [isFullyAllocated, setIsFullyAllocated] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);

  // Fetch accepted job details and hours logged from time_entries
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        if (!project) return;
        
        // Use project_id and job_app_id directly from the project
        const projectId = project.project_id;
        const jobAppId = project.job_app_id;
        
        if (!projectId || !jobAppId) {
          console.log("Missing project_id or job_app_id", project);
          return;
        }
        
        console.log("Fetching job details for project:", projectId, "job app:", jobAppId);
        
        // Get equity information from accepted_jobs using job_app_id
        const { data: acceptedJobData, error: acceptedJobError } = await supabase
          .from('accepted_jobs')
          .select('equity_agreed, jobs_equity_allocated')
          .eq('job_app_id', jobAppId)
          .single();
          
        if (acceptedJobError) {
          console.error("Error fetching accepted job:", acceptedJobError);
        } else if (acceptedJobData) {
          console.log("Accepted job data:", acceptedJobData);
          setAgreedEquity(acceptedJobData.equity_agreed);
          setJobsEquityAllocated(acceptedJobData.jobs_equity_allocated);
          
          // Check if agreed_equity equals jobs_equity_allocated
          setIsFullyAllocated(
            acceptedJobData.equity_agreed !== null && 
            acceptedJobData.jobs_equity_allocated !== null && 
            acceptedJobData.equity_agreed === acceptedJobData.jobs_equity_allocated
          );
        }
        
        // Get task_id from job_applications for this job_app_id
        const { data: jobAppData, error: jobAppError } = await supabase
          .from('job_applications')
          .select('task_id')
          .eq('job_app_id', jobAppId)
          .single();
          
        if (jobAppError) {
          console.error("Error fetching job application:", jobAppError);
          return;
        }
        
        if (!jobAppData?.task_id) {
          console.log("No task_id found for job_app_id:", jobAppId);
          return;
        }
        
        const taskId = jobAppData.task_id;
        console.log("Found task_id:", taskId);
        
        // Get related tickets for the task
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, estimated_hours')
          .eq('task_id', taskId);
          
        if (ticketsError) {
          console.error("Error fetching tickets:", ticketsError);
          return;
        }
        
        if (!ticketsData || ticketsData.length === 0) {
          console.log("No tickets found for task:", taskId);
          return;
        }
        
        console.log("Found tickets:", ticketsData);
        
        // Set estimated hours from first ticket
        if (ticketsData[0]?.estimated_hours) {
          setEstimatedHours(ticketsData[0].estimated_hours);
        }
        
        // Get time entries for all tickets
        const ticketIds = ticketsData.map(ticket => ticket.id);
        
        const { data: timeEntriesData, error: timeEntriesError } = await supabase
          .from('time_entries')
          .select('hours_logged')
          .in('ticket_id', ticketIds);
          
        if (timeEntriesError) {
          console.error("Error fetching time entries:", timeEntriesError);
          return;
        }
        
        console.log("Time entries:", timeEntriesData);
        
        // Calculate total hours logged
        const totalHours = timeEntriesData?.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0) || 0;
        setHoursLogged(totalHours);
        
      } catch (error) {
        console.error("Error in fetchJobDetails:", error);
      }
    };
    
    fetchJobDetails();
  }, [project]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // If project is undefined, render a placeholder or return null
  if (!project) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <p className="text-muted-foreground">Project data is unavailable</p>
        </CardContent>
      </Card>
    );
  }

  // Create a simplified application object from the project data
  const application = {
    job_app_id: project.job_app_id || "",
    status: project.status,
    created_at: project.start_date,
    business_roles: project.business_roles,
    user_id: "",
    task_id: project.id || "",
  } as JobApplication;

  // Extract task information directly from business_roles
  const taskTitle = project.business_roles?.title || project.title || "Untitled Task";
  const taskDescription = project.business_roles?.description || "";
  const taskStatus = project.status || 'active';
  const taskTimeframe = project.time_allocated || '';
  const taskEquityAllocation = project.equity_amount || 0;
  const taskSkillRequirements = project.business_roles?.skill_requirements || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{taskTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {project.business_roles?.company_name || "Unknown Company"} - {project.title || "Untitled Project"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
          >
            {isExpanded ? "Less Details" : "More Details"}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <div className="space-y-3">
              <h4 className="font-medium">Project Description</h4>
              <p className="text-sm text-muted-foreground">
                {taskDescription || "No description available."}
              </p>
              
              {project.business_roles?.description && taskDescription !== project.business_roles?.description && (
                <div>
                  <h4 className="font-medium mt-3">Company Details</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.business_roles.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="text-sm text-muted-foreground">
                Started: {new Date(project.start_date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWithdrawDialogOpen(true)}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAcceptDialogOpen(true)}
              >
                Accept
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div>
              <div className="text-sm font-medium">Task Status</div>
              <div className="text-sm">{taskStatus || 'In Progress'}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Equity Allocation / Earned</div>
              <div className="text-sm">
                {agreedEquity !== null ? `${agreedEquity}%` : `${taskEquityAllocation}%`} / 
                {jobsEquityAllocated !== null ? ` ${jobsEquityAllocated}%` : ' 0%'}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Hours Estimated / Logged</div>
              <div className="text-sm">{estimatedHours || 'Not set'} / {hoursLogged || 0} hrs</div>
            </div>
          </div>
          
          <div className="mt-2">
            <ProjectInfo
              taskStatus={taskStatus}
              timeframe={taskTimeframe}
              equityAllocation={agreedEquity !== null ? agreedEquity : taskEquityAllocation}
              skillRequirements={taskSkillRequirements}
            />
          </div>
          
          {isFullyAllocated && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm font-medium text-green-700">Equity Earned</div>
              <div className="text-sm text-green-600">
                Congratulations! You have earned {agreedEquity}% equity in this project.
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={async (reason?: string) => {
          if (onWithdraw && application.job_app_id) {
            await onWithdraw(application.job_app_id, reason);
          }
        }}
        isWithdrawing={isWithdrawing}
      />

      <AcceptJobDialog
        isOpen={isAcceptDialogOpen}
        onOpenChange={setIsAcceptDialogOpen}
        onAccept={async () => {
          if (onAccept) {
            await onAccept(application);
          }
          return Promise.resolve();
        }}
        application={application}
      />
    </Card>
  );
};
