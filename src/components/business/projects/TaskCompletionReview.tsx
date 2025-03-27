
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";
import { TaskCompletionReviewProps } from "@/types/types";

export const TaskCompletionReview: React.FC<TaskCompletionReviewProps> = ({
  task,
  businessId,
  onClose,
  onTaskAction,
  open = false,
  setOpen,
}) => {
  const [equityAllocated, setEquityAllocated] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(task?.completion_percentage || 0);
  const [equityAgreed, setEquityAgreed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [jobAppId, setJobAppId] = useState<string | null>(null);

  useEffect(() => {
    if (task && open) {
      setCompletionPercentage(task.completion_percentage || 0);
      
      // Fetch equity information from accepted_jobs
      const fetchEquityData = async () => {
        try {
          // If task has job_app_id, use it directly
          let appId = task.job_app_id;
          
          // If no job_app_id on task, try to find it using task_id
          if (!appId && task.task_id) {
            const { data: jobAppData, error: jobAppError } = await supabase
              .from('job_applications')
              .select('job_app_id')
              .eq('task_id', task.task_id)
              .single();
              
            if (jobAppData) {
              appId = jobAppData.job_app_id;
              setJobAppId(appId);
            }
          }
          
          if (appId) {
            const { data: acceptedJobData, error: acceptedJobError } = await supabase
              .from('accepted_jobs')
              .select('equity_agreed, jobs_equity_allocated')
              .eq('job_app_id', appId)
              .single();
              
            if (acceptedJobData) {
              setEquityAgreed(acceptedJobData.equity_agreed || 0);
              setEquityAllocated(acceptedJobData.jobs_equity_allocated || 0);
            }
          }
        } catch (error) {
          console.error("Error fetching equity data:", error);
        }
      };
      
      fetchEquityData();
    }
  }, [task, open]);

  const handleCompletionUpdate = async () => {
    if (!task) return;
    
    setIsLoading(true);
    
    try {
      // Update task completion percentage
      if (onTaskAction) {
        await onTaskAction(task.id, 'updateCompletionPercentage', completionPercentage);
      }
      
      // If applicable, update equity allocation in accepted_jobs
      if (jobAppId && completionPercentage > 0) {
        // Calculate equity to allocate (proportional to completion)
        const newEquityToAllocate = (equityAgreed * (completionPercentage / 100)).toFixed(2);
        
        // Update the accepted_jobs record
        const { error: updateError } = await supabase
          .from('accepted_jobs')
          .update({ jobs_equity_allocated: parseFloat(newEquityToAllocate) })
          .eq('job_app_id', jobAppId);
          
        if (updateError) throw updateError;
      }
      
      if (setOpen) setOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating task completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Review Task Completion</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name</Label>
            <Input id="taskName" value={task?.title} readOnly className="bg-gray-50" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equity-agreed">Agreed Equity</Label>
            <Input id="equity-agreed" value={`${equityAgreed}%`} readOnly className="bg-gray-50" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equity-allocated">Allocated Equity</Label>
            <Input id="equity-allocated" value={`${equityAllocated}%`} readOnly className="bg-gray-50" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="completion">Completion Percentage</Label>
              <span>{completionPercentage}%</span>
            </div>
            <Slider
              id="completion"
              value={[completionPercentage]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => setCompletionPercentage(value[0])}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCompletionUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Completion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
