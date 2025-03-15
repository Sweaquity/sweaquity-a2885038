
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { EquityProject, SubTask } from '@/types/jobSeeker';
import { skillsToStrings } from '@/utils/skillHelpers';

interface ProjectApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (message: string) => Promise<void>;
  project: EquityProject | null;
  task: SubTask | null;
  isLoading: boolean;
}

export const ProjectApplyDialog = ({
  open,
  onOpenChange,
  onApply,
  project,
  task,
  isLoading
}: ProjectApplyDialogProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    await onApply(message);
    setMessage('');
  };

  if (!project || !task) return null;

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Role</DialogTitle>
          <DialogDescription>
            You're applying for "{task.title}" in the project "{project.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium text-sm mb-1">Role Details</h4>
              <p className="text-sm">{task.description}</p>
              
              {task.equity_allocation && (
                <div className="mt-2">
                  <span className="text-xs font-medium">Equity: </span>
                  <span className="text-xs">{task.equity_allocation}%</span>
                </div>
              )}
              
              {task.timeframe && (
                <div className="mt-1">
                  <span className="text-xs font-medium">Timeframe: </span>
                  <span className="text-xs">{task.timeframe}</span>
                </div>
              )}

              {task.skill_requirements && task.skill_requirements.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-medium">Skills Required: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skillsToStrings(task.skill_requirements).map((skill, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message (Optional)
              </label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you're a good fit for this role..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
