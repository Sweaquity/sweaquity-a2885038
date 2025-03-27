
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
        
        // Safely get task ID
        const taskId = project.sub_tasks && project.sub_tasks[0]?.task_id || project.id;
        
        if (!taskId) return;
        
        // Get job_app_id for the task - using .eq instead of .single to handle multiple results
        const { data: jobAppsData, error: jobAppError } = await supabase
          .from('job_applications')
          .select('job_app_id')
          .eq('task_id', taskId);
          
        if (jobAppError) {
          console.error("Error fetching job applications:", jobAppError);
          return;
        }
        
        if (!jobAppsData || jobAppsData.length === 0) {
          console.log("No job applications found for task:", taskId);
          return;
        }
        
        // Get first job app id (we can handle multiple later if needed)
        const jobAppId = jobAppsData[0]?.job_app_id;
        
        if (!jobAppId) return;
        
        console.log("Found job application ID:", jobAppId);
        
        // Get equity information from accepted_jobs
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

  // Format the task from the project for display
  const task = project.sub_tasks && project.sub_tasks[0] ? project.sub_tasks[0] : {};
  const application = {
    job_app_id: project.job_app_id || "",
    status: project.status,
    created_at: project.start_date,
    business_roles: project.business_roles,
    user_id: "",
    task_id: task.task_id || "",
  } as JobApplication;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{task.title || project.title || "Untitled Task"}</h3>
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
                {task.description || project.business_roles?.description || "No description available."}
              </p>
              
              {project.business_roles?.description && task.description !== project.business_roles?.description && (
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
              <div className="text-sm">{task.task_status || project.status || 'In Progress'}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Equity Allocation / Earned</div>
              <div className="text-sm">
                {agreedEquity !== null ? `${agreedEquity}%` : (task.equity_allocation || project.equity_amount || 0) + '%'} / 
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
              taskStatus={task.task_status || project.status}
              timeframe={task.timeframe || project.time_allocated}
              equityAllocation={agreedEquity !== null ? agreedEquity : (task.equity_allocation || project.equity_amount || 0)}
              skillRequirements={task.skill_requirements || []}
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
