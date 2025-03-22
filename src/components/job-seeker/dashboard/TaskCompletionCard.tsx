import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TimeTracker } from "./TimeTracker";

interface TaskCompletionCardProps {
  taskId: string;
  ticketId?: string;
  jobAppId?: string;
  projectId: string;
  taskTitle: string;
  taskDescription: string;
  equityAllocation: number;
  taskStatus: string;
  userId: string;
  completionPercentage: number;
  equityEarned: number;
  onStatusChange: () => void;
}

export const TaskCompletionCard: React.FC<TaskCompletionCardProps> = ({
  taskId,
  ticketId,
  jobAppId,
  projectId,
  taskTitle,
  taskDescription,
  equityAllocation,
  taskStatus,
  userId,
  completionPercentage,
  equityEarned,
  onStatusChange
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showTimeTracker, setShowTimeTracker] = useState(false);

  const handleMarkAsComplete = async () => {
    if (!completionNotes.trim()) {
      toast.error("Please provide completion notes before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update task status in project_sub_tasks
      const { error: taskError } = await supabase
        .from('project_sub_tasks')
        .update({
          task_status: 'completed',
          completion_percentage: 100,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', taskId);
      
      if (taskError) {
        console.error("Error updating task status:", taskError);
        throw taskError;
      }
      
      // Update the job application if jobAppId is provided
      if (jobAppId) {
        const { error: appError } = await supabase
          .from('job_applications')
          .update({
            task_discourse: completionNotes
          })
          .eq('job_app_id', jobAppId);
          
        if (appError) {
          console.error("Error updating job application:", appError);
          throw appError;
        }
      }
      
      // Create or update associated ticket if ticketId is provided
      if (ticketId) {
        // First fetch the current notes array
        const { data: ticketData, error: fetchError } = await supabase
          .from('tickets')
          .select('notes')
          .eq('id', ticketId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching ticket:", fetchError);
          throw fetchError;
        }
        
        // Create new note object
        const noteObject = {
          action: 'Task completed by job seeker',
          user: userId,
          timestamp: new Date().toISOString(),
          comment: completionNotes
        };
        
        // Prepare notes array (append to existing or create new)
        const updatedNotes = Array.isArray(ticketData.notes) 
          ? [...ticketData.notes, noteObject] 
          : [noteObject];
        
        // Update the ticket
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            status: 'review',
            notes: updatedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (ticketError) {
          console.error("Error updating ticket:", ticketError);
          throw ticketError;
        }
      }
      
      toast.success("Task marked as complete and submitted for review");
      onStatusChange();
      
    } catch (error) {
      console.error("Error marking task as complete:", error);
      toast.error("Failed to mark task as complete");
    } finally {
      setIsSubmitting(false);
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
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Completion Progress</p>
            <span className="text-sm">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Equity Allocation</p>
            <p className="font-medium">{equityAllocation}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Equity Earned</p>
            <p className="font-medium">{equityEarned}%</p>
          </div>
        </div>
        
        {taskStatus !== 'completed' && taskStatus !== 'approved' && (
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowTimeTracker(!showTimeTracker)}
            >
              <Clock className="h-4 w-4 mr-2" />
              {showTimeTracker ? "Hide Time Tracker" : "Log Time"}
            </Button>
            
            {showTimeTracker && ticketId && (
              <TimeTracker 
                ticketId={ticketId} 
                userId={userId} 
                jobAppId={jobAppId}
                projectId={projectId}
                taskId={taskId}
              />
            )}
          </div>
        )}
        
        {taskStatus !== 'completed' && taskStatus !== 'approved' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Completion Notes</p>
            <Textarea
              placeholder="Describe what you've accomplished and how you've completed this task..."
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </div>
        )}
      </CardContent>
      
      {taskStatus !== 'completed' && taskStatus !== 'approved' && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleMarkAsComplete}
            disabled={isSubmitting || !completionNotes.trim()}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </CardFooter>
      )}
      
      {taskStatus === 'completed' && (
        <CardFooter>
          <div className="w-full p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
            <p className="text-sm">This task is currently under review by the business</p>
          </div>
        </CardFooter>
      )}
      
      {taskStatus === 'approved' && (
        <CardFooter>
          <div className="w-full p-3 bg-green-50 rounded-md border border-green-200 text-green-700 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <p className="text-sm">This task has been approved and equity has been allocated</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
