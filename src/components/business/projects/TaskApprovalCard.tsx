
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TaskApprovalCardProps {
  taskId: string;
  jobAppId: string;
  ticketId?: string;
  projectId: string;
  taskTitle: string;
  taskDescription: string;
  maxEquityAllocation: number;
  completionNotes: string;
  onApproved: () => void;
}

export const TaskApprovalCard: React.FC<TaskApprovalCardProps> = ({
  taskId,
  jobAppId,
  ticketId,
  projectId,
  taskTitle,
  taskDescription,
  maxEquityAllocation,
  completionNotes,
  onApproved
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [equityToAllocate, setEquityToAllocate] = useState(maxEquityAllocation);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateEquityAmount = () => {
    if (equityToAllocate <= 0) {
      toast.error("Equity allocation must be greater than zero");
      return false;
    }
    
    if (equityToAllocate > maxEquityAllocation) {
      toast.error(`Equity allocation cannot exceed ${maxEquityAllocation}%`);
      return false;
    }
    
    return true;
  };

  const handleConfirmClick = () => {
    if (!validateEquityAmount()) return;
    if (!approvalNotes.trim()) {
      toast.error("Please provide approval notes");
      return;
    }
    setShowConfirmation(true);
  };

  const handleApproveTask = async () => {
    if (!validateEquityAmount()) return;
    
    try {
      setIsSubmitting(true);
      
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to approve tasks");
        return;
      }
      
      // Transaction to update all related records
      
      // 1. Update the accepted_jobs table
      const { data: acceptedJob, error: acceptedJobError } = await supabase
        .from('accepted_jobs')
        .update({
          equity_agreed: equityToAllocate,
          accepted_discourse: approvalNotes
        })
        .eq('job_app_id', jobAppId)
        .select()
        .single();
      
      if (acceptedJobError) {
        console.error("Error updating accepted job:", acceptedJobError);
        throw acceptedJobError;
      }
      
      // 2. Update the project_sub_tasks table
      const { error: taskError } = await supabase
        .from('project_sub_tasks')
        .update({
          task_status: 'approved',
          equity_allocation: equityToAllocate // Update with the actual allocated amount
        })
        .eq('task_id', taskId);
      
      if (taskError) {
        console.error("Error updating task:", taskError);
        throw taskError;
      }
      
      // 3. Update the job_applications table
      const { error: appError } = await supabase
        .from('job_applications')
        .update({
          accepted_business: true
        })
        .eq('job_app_id', jobAppId);
      
      if (appError) {
        console.error("Error updating job application:", appError);
        throw appError;
      }
      
      // 4. Update the ticket if one exists
      if (ticketId) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            status: 'done',
            equity_points: equityToAllocate,
            notes: supabase.sql`array_append(notes, jsonb_build_object('action', 'Task approved by business', 'user', ${user.id}, 'timestamp', ${new Date().toISOString()}, 'comment', ${approvalNotes}))`,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (ticketError) {
          console.error("Error updating ticket:", ticketError);
          throw ticketError;
        }
      }
      
      // 5. Update the project's equity_allocated value
      const { data: project, error: projectFetchError } = await supabase
        .from('business_projects')
        .select('equity_allocated')
        .eq('project_id', projectId)
        .single();
      
      if (projectFetchError) {
        console.error("Error fetching project:", projectFetchError);
        throw projectFetchError;
      }
      
      const currentAllocated = project.equity_allocated || 0;
      const newAllocated = currentAllocated + equityToAllocate;
      
      const { error: projectUpdateError } = await supabase
        .from('business_projects')
        .update({
          equity_allocated: newAllocated
        })
        .eq('project_id', projectId);
      
      if (projectUpdateError) {
        console.error("Error updating project equity allocation:", projectUpdateError);
        throw projectUpdateError;
      }
      
      toast.success("Task approved and equity allocated successfully");
      onApproved();
      
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{taskTitle}</CardTitle>
          <Badge variant="outline">Pending Approval</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Task Description</p>
          <p className="text-sm">{taskDescription}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Completion Notes from Job Seeker</p>
          <div className="p-3 bg-secondary/30 rounded-md text-sm">
            {completionNotes || "No completion notes provided"}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="equity-allocation">Equity to Allocate (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="equity-allocation"
              type="number"
              value={equityToAllocate}
              onChange={(e) => setEquityToAllocate(parseFloat(e.target.value) || 0)}
              min="0"
              max={maxEquityAllocation}
              step="0.1"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Max: {maxEquityAllocation}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="approval-notes">Approval Notes</Label>
          <Textarea
            id="approval-notes"
            placeholder="Add any notes about this approval..."
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
        </div>
        
        {!showConfirmation ? (
          <Button 
            className="w-full" 
            onClick={handleConfirmClick}
            disabled={isSubmitting || !approvalNotes.trim() || equityToAllocate <= 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Allocate Equity
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-700">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Confirm Equity Allocation</p>
                  <p className="text-sm mt-1">
                    You are about to allocate <strong>{equityToAllocate}%</strong> equity to this task. 
                    This action cannot be reversed.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                className="flex-1"
                onClick={handleApproveTask}
                disabled={isSubmitting}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
