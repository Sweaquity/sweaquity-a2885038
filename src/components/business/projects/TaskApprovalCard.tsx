import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TaskApprovalCardProps {
  taskId: string;
  ticketId?: string;
  jobAppId?: string;
  projectId: string;
  taskTitle: string;
  taskDescription: string;
  taskEquityAllocation: number;
  taskStatus: string;
  userId: string;
  onTaskUpdated: () => void;
}

export const TaskApprovalCard: React.FC<TaskApprovalCardProps> = ({
  taskId,
  ticketId,
  jobAppId,
  projectId,
  taskTitle,
  taskDescription,
  taskEquityAllocation,
  taskStatus,
  userId,
  onTaskUpdated
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApproveTask = async () => {
    try {
      setIsUpdating(true);
    
    // First, fetch the current equity allocated for this project
    const { data: projectData, error: projectError } = await supabase
      .from('business_projects')
      .select('equity_allocation, equity_allocated')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error("Error fetching project data:", projectError);
      throw projectError;
    }
    
    // Calculate new equity allocation after this task approval
    const newTotalEquityAllocated = (projectData.equity_allocated || 0) + taskEquityAllocation;
    
    // Ensure we don't exceed project limits
    if (newTotalEquityAllocated > projectData.equity_allocation) {
      toast.error("Cannot approve task - would exceed project equity allocation limits");
      return;
    }
    
    // Update task status in project_sub_tasks
    const { error: taskError } = await supabase
      .from('project_sub_tasks')
      .update({
        task_status: 'approved',
        completion_percentage: 100,
        equity_earned: taskEquityAllocation,
        equity_approved_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('task_id', taskId);
    
    if (taskError) {
      console.error("Error updating task status:", taskError);
      throw taskError;
    }
    
    // Update the accepted_jobs record if jobAppId is provided
    if (jobAppId) {
      const { error: jobError } = await supabase
        .from('accepted_jobs')
        .update({
          equity_agreed: taskEquityAllocation,
          equity_agreement_date: new Date().toISOString()
        })
        .eq('job_app_id', jobAppId);
      
      if (jobError) {
        console.error("Error updating accepted job:", jobError);
        throw jobError;
      }
    }
    
    // Update the job_application status
    if (jobAppId) {
      const { error: appError } = await supabase
        .from('job_applications')
        .update({
          status: 'completed'
        })
        .eq('job_app_id', jobAppId);
      
      if (appError) {
        console.error("Error updating job application:", appError);
        throw appError;
      }
    }
    
    // Update the project's total equity allocated
    const { error: updateProjectError } = await supabase
      .from('business_projects')
      .update({
        equity_allocated: newTotalEquityAllocated
      })
      .eq('id', projectId);
    
    if (updateProjectError) {
      console.error("Error updating project equity allocation:", updateProjectError);
      throw updateProjectError;
    }
    
    // Update ticket status if ticketId is provided
    if (ticketId) {
      // First fetch current notes
      const { data: ticketData, error: fetchTicketError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
      
      if (fetchTicketError) {
        console.error("Error fetching ticket:", fetchTicketError);
        throw fetchTicketError;
      }
      
      // Create new note object
      const noteObject = {
        action: 'Task approved and equity allocated',
        user: userId,
        timestamp: new Date().toISOString(),
        equity: taskEquityAllocation
      };
      
      // Prepare updated notes array
      const updatedNotes = Array.isArray(ticketData.notes) 
        ? [...ticketData.notes, noteObject] 
        : [noteObject];
      
      // Update the ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          status: 'done',
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (ticketError) {
        console.error("Error updating ticket:", ticketError);
        throw ticketError;
      }
    }
    
    toast.success("Task approved and equity allocated successfully");
    onTaskUpdated();
    
  } catch (error) {
    console.error("Error approving task:", error);
    toast.error("Failed to approve task");
  } finally {
    setIsUpdating(false);
  }
};

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{taskTitle}</CardTitle>
          <Badge 
            variant={
              taskStatus === 'completed' ? 'secondary' :
              taskStatus === 'review' ? 'outline' :
              'default'
            }
          >
            {taskStatus === 'completed' ? 'Completed' : 
             taskStatus === 'review' ? 'In Review' : 
             taskStatus === 'approved' ? 'Approved' : 'In Progress'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Task Description</p>
          <p className="text-sm">{taskDescription}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Equity Allocation</p>
            <p className="font-medium">{taskEquityAllocation}%</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleApproveTask}
          disabled={isUpdating}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve Task
        </Button>
      </CardFooter>
    </Card>
  );
};
