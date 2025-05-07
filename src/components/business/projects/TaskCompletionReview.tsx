
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TaskCompletionReviewProps } from "@/types/types";
import { useAwardAgreementManagement } from "@/hooks/useAwardAgreementManagement";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const TaskCompletionReview: React.FC<TaskCompletionReviewProps> = ({
  task,
  open,
  setOpen,
  onClose,
  businessId,
  onReviewComplete = () => {}
}) => {
  const [completionPercentage, setCompletionPercentage] = useState<number>(task?.completion_percentage || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equityToAward, setEquityToAward] = useState<number>(0);
  const [jobAppData, setJobAppData] = useState<any>(null);
  const [assignedUserData, setAssignedUserData] = useState<any>(null);
  const [generateAgreement, setGenerateAgreement] = useState<boolean>(true);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  const { isGenerating, generateAwardAgreement } = useAwardAgreementManagement();

  useEffect(() => {
    if (task && task.job_app_id) {
      fetchJobApplicationData(task.job_app_id);
    } else if (task && task.task_id) {
      // If no job_app_id is directly available, try to find it through the task_id
      fetchJobAppIdFromTaskId(task.task_id);
    }
    
    if (task && task.assigned_to) {
      fetchAssignedUserData(task.assigned_to);
    }
  }, [task]);

  useEffect(() => {
    // Calculate equity to award whenever completionPercentage or jobAppData changes
    if (jobAppData?.accepted_jobs?.equity_agreed) {
      const equityAgreed = jobAppData.accepted_jobs.equity_agreed;
      const percentageToAward = completionPercentage / 100;
      setEquityToAward(Math.round(equityAgreed * percentageToAward * 10) / 10);
    }
  }, [completionPercentage, jobAppData]);

  const fetchJobAppIdFromTaskId = async (taskId: string) => {
    try {
      console.log("Fetching job application data from task ID:", taskId);
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_app_id')
        .eq('task_id', taskId)
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.job_app_id) {
        console.log("Found job app ID from task ID:", data.job_app_id);
        fetchJobApplicationData(data.job_app_id);
      } else {
        console.log("No job application found for task ID:", taskId);
      }
    } catch (error) {
      console.error("Error fetching job application ID from task ID:", error);
    }
  };

  const fetchJobApplicationData = async (jobAppId: string) => {
    try {
      console.log("Fetching job application data for ID:", jobAppId);
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          accepted_jobs:job_app_id(
            equity_agreed,
            jobs_equity_allocated,
            id,
            award_agreement_document_id,
            award_agreement_status
          )
        `)
        .eq('job_app_id', jobAppId)
        .single();
        
      if (error) throw error;
      
      setJobAppData(data);
      console.log("Job application data:", data);
      
      if (task?.completion_percentage) {
        setCompletionPercentage(task.completion_percentage);
      }
      
      // If award agreement already exists, don't generate a new one by default
      if (data?.accepted_jobs?.award_agreement_document_id) {
        setGenerateAgreement(false);
      }
    } catch (error) {
      console.error("Error fetching job application data:", error);
      toast.error("Failed to load job application data");
    }
  };
  
  const fetchAssignedUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      setAssignedUserData(data);
      console.log("Assigned user data:", data);
    } catch (error) {
      console.error("Error fetching assigned user data:", error);
    }
  };

  const handleApproveTask = async () => {
    try {
      setIsSubmitting(true);
      
      if (!task) {
        toast.error("Missing task data");
        return;
      }
      
      // Update equity allocated in accepted_jobs if we have job app data
      if (jobAppData?.accepted_jobs?.id) {
        console.log("Updating accepted job with equity allocation:", equityToAward);
        const { error: updateError } = await supabase
          .from('accepted_jobs')
          .update({
            jobs_equity_allocated: equityToAward
          })
          .eq('id', jobAppData.accepted_jobs.id);
          
        if (updateError) throw updateError;
        
        // Generate award agreement if requested and doesn't exist already
        if (generateAgreement && 
            completionPercentage >= 100 && 
            !jobAppData.accepted_jobs.award_agreement_document_id &&
            jobAppData.project_id &&
            jobAppData.user_id) {
          
          try {
            const businessId = businessId || '';
            const jobseekerId = jobAppData.user_id || '';
            const projectId = jobAppData.project_id || '';
            const jobApplicationId = jobAppData.job_app_id || '';
            const completedDeliverables = task.description || 'completed the agreed services';
            
            await generateAwardAgreement(
              jobAppData.accepted_jobs.id,
              businessId,
              jobseekerId,
              projectId,
              jobApplicationId,
              completedDeliverables
            );
            
            toast.success("Equity Award Agreement generated successfully");
          } catch (error) {
            console.error("Failed to generate Equity Award Agreement:", error);
            toast.error("Failed to generate Award Agreement");
          }
        }
      } else {
        console.log("No accepted job data available to update");
      }
      
      // Update task completion status
      if (completionPercentage >= 100 && task.task_id) {
        console.log("Closing project sub task with ID:", task.task_id);
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({
            task_status: 'closed',
            completion_percentage: 100
          })
          .eq('task_id', task.task_id);
          
        if (taskError) throw taskError;
      }
      
      // Update ticket status
      console.log("Updating ticket with ID:", task.id);
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          completion_percentage: completionPercentage,
          status: completionPercentage >= 100 ? 'done' : 'in-progress'
        })
        .eq('id', task.id);
        
      if (ticketError) throw ticketError;
      
      // Call the update_active_project function to ensure all related records are updated
      if (task.task_id) {
        console.log("Calling update_active_project function for task ID:", task.task_id);
        const { error: functionError } = await supabase.rpc('update_active_project', {
          p_task_id: task.task_id,
          p_completion_percentage: completionPercentage,
          p_status: completionPercentage >= 100 ? 'done' : 'in-progress'
        });
        
        if (functionError) {
          console.error("Error calling update_active_project function:", functionError);
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setOpen(false);
        if (onClose) onClose();
        if (onReviewComplete) onReviewComplete();
      }, 2000);
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = () => {
    toast.info("Feature coming soon");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        {showSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Task Approved Successfully</h3>
            <p className="text-muted-foreground">
              {equityToAward}% equity has been awarded.
              {generateAgreement && completionPercentage >= 100 ? " An Equity Award Agreement has been generated." : ""}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review Task Completion</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <h3 className="font-medium text-lg">{task.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {task.description || "No description available"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Task Details</div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="outline" className="bg-gray-100">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Equity Points:</span>
                      <span>{task.equity_points || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Hours:</span>
                      <span>{task.estimated_hours || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Completed By</div>
                  <div className="text-sm space-y-2">
                    {assignedUserData ? (
                      <div>
                        <span>{assignedUserData.first_name} {assignedUserData.last_name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        User information not available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Completion Assessment</div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="completion" className="text-sm">
                      Completion Percentage:
                    </label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="completion"
                        type="number"
                        min="0"
                        max="100"
                        value={completionPercentage}
                        onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                        className="w-20 text-right"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md bg-blue-50 text-blue-900">
                    <div className="font-medium">Equity to be awarded: {equityToAward}%</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Based on {completionPercentage}% completion of {jobAppData?.accepted_jobs?.equity_agreed || 0}% agreed equity
                    </div>
                  </div>
                  
                  {completionPercentage >= 100 && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="generateAwardAgreement"
                        checked={generateAgreement}
                        onChange={() => setGenerateAgreement(!generateAgreement)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="generateAwardAgreement" className="text-sm">
                        Generate Equity Award Agreement
                      </label>
                    </div>
                  )}
                  
                  {jobAppData?.accepted_jobs?.award_agreement_document_id && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Note</AlertTitle>
                      <AlertDescription className="text-amber-700 text-sm">
                        An Equity Award Agreement already exists for this job. Creating a new one will replace the existing agreement.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestChanges}
              >
                Request Changes
              </Button>
              
              <Button
                type="button"
                onClick={handleApproveTask}
                disabled={isSubmitting || isGenerating}
              >
                {isSubmitting || isGenerating ? "Processing..." : "Approve Task"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
