
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EquityProject, SubTask } from "@/types/jobSeeker";
import { Badge } from "@/components/ui/badge";

interface ApplyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: EquityProject | null;
  task: SubTask | null;
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
}

export const ApplyDialog = ({
  isOpen,
  onOpenChange,
  project,
  task,
  onSubmit,
  isSubmitting
}: ApplyDialogProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    await onSubmit(message);
    setMessage("");
  };

  if (!project || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Apply for Project Task</DialogTitle>
        <DialogDescription>
          You are applying for a task in {project.business_roles?.company_name || "this project"}.
        </DialogDescription>

        <div className="space-y-4 py-2">
          <div>
            <h4 className="font-medium text-sm">Project</h4>
            <p>{project.title}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Task</h4>
            <p>{task.title}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Equity Allocation</h4>
            <Badge>{task.equity_allocation}%</Badge>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Required Skills</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {task.skill_requirements?.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {typeof skill === 'string' ? skill : skill.skill}
                </Badge>
              )) || <span className="text-sm text-muted-foreground">No specific skills required</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Why are you a good fit for this task?</h4>
            <Textarea
              placeholder="Tell the project owner about your skills and experience relevant to this task..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Applying..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
