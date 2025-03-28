
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Ticket } from '@/types/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TaskCompletionReviewProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function TaskCompletionReview({ ticket, open, onOpenChange, onUpdate }: TaskCompletionReviewProps) {
  const [completionPercentage, setCompletionPercentage] = useState<number>(
    ticket?.completion_percentage || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompletionUpdate = async () => {
    if (!ticket?.id) return;

    setIsSubmitting(true);
    try {
      // First, update the tickets table
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          completion_percentage: completionPercentage,
          status: completionPercentage >= 100 ? 'completed' : 'in-progress'
        })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      // If the ticket has a task_id, update the project_sub_tasks table as well
      if (ticket.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({
            completion_percentage: completionPercentage,
            task_status: completionPercentage >= 100 ? 'closed' : 'in-progress'
          })
          .eq('task_id', ticket.task_id);

        if (taskError) throw taskError;
      }

      toast.success("Task completion updated successfully");
      onOpenChange(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating task completion:", error);
      toast.error("Failed to update task completion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task Completion</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Task</Label>
            <Input
              id="task-title"
              value={ticket?.title || ''}
              readOnly
              className="bg-muted/50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="completion">Completion Percentage (%)</Label>
            <Input
              id="completion"
              type="number"
              min={0}
              max={100}
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCompletionUpdate} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Completion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
