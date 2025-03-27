
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

export const TaskCompletionReview: React.FC<TaskCompletionReviewProps> = ({
  task,
  open,
  setOpen,
  onClose
}) => {
  const [completionPercentage, setCompletionPercentage] = useState<number>(task?.completion_percentage || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equityToAward, setEquityToAward] = useState<number>(0);
  const [jobAppData, setJobAppData] = useState<any>(null);

  useEffect(() => {
    if (task && task.job_app_id) {
      fetchJobApplicationData(task.job_app_id);
    }
  }, [task]);

  useEffect(() => {
    if (jobAppData?.accepted_jobs?.equity_agreed) {
      // Calculate equity to award based on completion percentage
      const equityAgreed = jobAppData.accepted_jobs.equity_agreed;
      const percentageToAward = completionPercentage / 100;
      setEquityToAward(Math.round(equityAgreed * percentageToAward * 10) / 10); // Round to 1 decimal place
    }
  }, [completionPercentage, jobAppData]);

  const fetchJobApplicationData = async (jobAppId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          accepted_jobs:job_app_id(
            equity_agreed,
            jobs_equity_allocated,
            id
          )
        `)
        .eq('job_app_id', jobAppId)
        .single();
        
      if (error) throw error;
      
      setJobAppData(data);
      
      // Set initial completion percentage from the task
      if (task?.completion_percentage) {
        setCompletionPercentage(task.completion_percentage);
      }
    } catch (error) {
      console.error("Error fetching job application data:", error);
      toast.error("Failed to load job application data");
    }
  };

  const handleApproveTask = async () => {
    try {
      setIsSubmitting(true);
      
      if (!task || !jobAppData?.accepted_jobs?.id) {
        toast.error("Missing task or accepted job data");
        return;
      }
      
      // Update the accepted_jobs table with the newly allocated equity
      const { error: updateError } = await supabase
        .from('accepted_jobs')
        .update({
          jobs_equity_allocated: equityToAward
        })
        .eq('id', jobAppData.accepted_jobs.id);
        
      if (updateError) throw updateError;
      
      // Update the task status if it's 100% complete
      if (completionPercentage >= 100) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({
            task_status: 'closed',
            completion_percentage: 100
          })
          .eq('task_id', task.task_id);
          
        if (taskError) throw taskError;
      }
      
      // Update the ticket completion percentage and status
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          completion_percentage: completionPercentage,
          status: completionPercentage >= 100 ? 'done' : 'in-progress'
        })
        .eq('id', task.id);
        
      if (ticketError) throw ticketError;
      
      // Call the update_active_project function to update relevant tables
      const { error: functionError } = await supabase.rpc('update_active_project', {
        p_task_id: task.task_id,
        p_completion_percentage: completionPercentage,
        p_status: completionPercentage >= 100 ? 'done' : 'in-progress'
      });
      
      if (functionError) {
        console.error("Error calling update_active_project function:", functionError);
        // Don't throw here as we've already made the main updates
      }
      
      toast.success(`Task approved. ${equityToAward}% equity awarded.`);
      
      // Close the dialog and refresh
      setOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    } finally {
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
                <div className="text-muted-foreground">
                  User information not available
                </div>
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
            disabled={isSubmitting}
          >
            Approve Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
