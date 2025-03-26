
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

interface TimeLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
  onClose?: () => void;
}

export const TimeLogDialog = ({
  isOpen,
  onOpenChange,
  ticket,
  onClose
}: TimeLogDialogProps) => {
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogTime = async () => {
    if (hours <= 0 || !description.trim()) {
      toast.error("Please enter valid hours and description");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to log time");
        return;
      }

      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });

      if (error) throw error;

      // Update the ticket's hours_logged field
      await supabase
        .from('tickets')
        .update({
          hours_logged: (ticket.hours_logged || 0) + hours
        })
        .eq('id', ticket.id);

      // If the ticket has a task_id, update project_sub_tasks
      if (ticket.task_id) {
        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('estimated_hours, completion_percentage')
          .eq('task_id', ticket.task_id)
          .single();

        if (!taskError && taskData) {
          const estimatedHours = taskData.estimated_hours || 0;
          let completionPercentage = taskData.completion_percentage || 0;

          // Calculate new completion percentage based on hours logged if estimated hours exists
          if (estimatedHours > 0) {
            const newHoursLogged = (ticket.hours_logged || 0) + hours;
            completionPercentage = Math.min(Math.round((newHoursLogged / estimatedHours) * 100), 100);
          }

          // Update project_sub_tasks
          await supabase
            .from('project_sub_tasks')
            .update({
              completion_percentage: completionPercentage,
              last_activity_at: new Date().toISOString()
            })
            .eq('task_id', ticket.task_id);

          // Update the ticket's completion_percentage
          await supabase
            .from('tickets')
            .update({
              completion_percentage: completionPercentage
            })
            .eq('id', ticket.id);

          // If completion is 100%, update status to review
          if (completionPercentage >= 100) {
            await supabase
              .from('project_sub_tasks')
              .update({
                status: 'review',
                task_status: 'review'
              })
              .eq('task_id', ticket.task_id);

            await supabase
              .from('tickets')
              .update({
                status: 'review'
              })
              .eq('id', ticket.id);
          }

          // Update the business_projects table
          if (ticket.project_id) {
            await updateProjectCompletion(ticket.project_id);
          }
        }
      }

      toast.success("Time logged successfully");
      setHours(0);
      setDescription('');
      onOpenChange(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectCompletion = async (projectId: string) => {
    try {
      // Get all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (tasksError) throw tasksError;
      
      if (!tasks || tasks.length === 0) return;
      
      // Calculate weighted completion percentage
      let totalEquity = 0;
      let totalCompletedEquity = 0;
      
      tasks.forEach(task => {
        const equity = task.equity_allocation || 0;
        totalEquity += equity;
        totalCompletedEquity += equity * (task.completion_percentage || 0) / 100;
      });
      
      const completionPercentage = totalEquity > 0 
        ? (totalCompletedEquity / totalEquity) * 100 
        : 0;
      
      // Update business_projects
      await supabase
        .from('business_projects')
        .update({
          completion_percentage: Math.round(completionPercentage),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);
    } catch (error) {
      console.error("Error updating project completion:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time for {ticket.title}</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleLogTime} 
            disabled={hours <= 0 || !description.trim() || isLoading}
          >
            {isLoading ? "Logging..." : "Log Time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
