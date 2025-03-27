
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { ApplicationContent } from "./ApplicationContent";
import { ApplicationHeader } from "./ApplicationHeader";
import { EquityProject, JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";

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

  // Fetch accepted job details and hours logged from time_entries
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Get the job_app_id from the project's sub_tasks
        const taskId = project.sub_tasks[0]?.task_id;
        
        if (!taskId) return;
        
        // Get job_app_id for the task
        const { data: jobAppData, error: jobAppError } = await supabase
          .from('job_applications')
          .select('job_app_id')
          .eq('task_id', taskId)
          .single();
          
        if (jobAppError) {
          console.error("Error fetching job application:", jobAppError);
          return;
        }
        
        const jobAppId = jobAppData?.job_app_id;
        
        if (!jobAppId) return;
        
        // Get equity information from accepted_jobs
        const { data: acceptedJobData, error: acceptedJobError } = await supabase
          .from('accepted_jobs')
          .select('agreed_equity, jobs_equity_allocated')
          .eq('job_app_id', jobAppId)
          .single();
          
        if (acceptedJobError) {
          console.error("Error fetching accepted job:", acceptedJobError);
          return;
        }
        
        if (acceptedJobData) {
          setAgreedEquity(acceptedJobData.agreed_equity);
          setJobsEquityAllocated(acceptedJobData.jobs_equity_allocated);
          
          // Check if agreed_equity equals jobs_equity_allocated
          setIsFullyAllocated(
            acceptedJobData.agreed_equity !== null && 
            acceptedJobData.jobs_equity_allocated !== null && 
            acceptedJobData.agreed_equity === acceptedJobData.jobs_equity_allocated
          );
        }
        
        // Get related tickets for the task
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('id')
          .eq('task_id', taskId);
          
        if (ticketsError) {
          console.error("Error fetching tickets:", ticketsError);
          return;
        }
        
        if (!ticketsData || ticketsData.length === 0) return;
        
        // Get time entries for all tickets
        const ticketIds = ticketsData.map(ticket => ticket.id);
        
        const { data: timeEntriesData, error: timeEntriesError } = await supabase
          .from('time_entries')
          .select('hours')
          .in('ticket_id', ticketIds);
          
        if (timeEntriesError) {
          console.error("Error fetching time entries:", timeEntriesError);
          return;
        }
        
        // Calculate total hours logged
        const totalHours = timeEntriesData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;
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

  // Format the task from the project for display
  const task = project.sub_tasks[0] || {};
  const application = {
    job_app_id: "",
    status: project.status,
    created_at: project.start_date,
    business_roles: project.business_roles,
  } as JobApplication;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <ApplicationHeader
          application={application}
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
        />

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <ApplicationContent application={application} />
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
              <div className="text-sm">{task.task_status || 'In Progress'}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Skills Required</div>
              <div className="text-sm">
                {task.skill_requirements?.map((skill, index) => (
                  <span key={index} className="inline-block mr-1">
                    {typeof skill === 'string' ? skill : skill.skill}
                    {index < (task.skill_requirements?.length || 0) - 1 ? ', ' : ''}
                  </span>
                )) || 'None specified'}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Timeframe</div>
              <div className="text-sm">{task.timeframe || 'Not specified'}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Equity Allocation / Earned</div>
              <div className="text-sm">
                {agreedEquity !== null ? `${agreedEquity}%` : 'Not specified'} / 
                {jobsEquityAllocated !== null ? ` ${jobsEquityAllocated}%` : ' 0%'}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Hours Logged</div>
              <div className="text-sm">{hoursLogged} hrs</div>
            </div>
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
        onClose={() => setIsWithdrawDialogOpen(false)}
        onWithdraw={() => {}}
        isLoading={isWithdrawing}
      />

      <AcceptJobDialog
        isOpen={isAcceptDialogOpen}
        onClose={() => setIsAcceptDialogOpen(false)}
        onAccept={() => Promise.resolve()}
        application={application}
      />
    </Card>
  );
};
