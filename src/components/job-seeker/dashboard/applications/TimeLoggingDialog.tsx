
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { JobApplication } from "@/types/jobSeeker";

interface TimeLoggingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
  onTimeLogged?: () => void;
}

export const TimeLoggingDialog = ({
  isOpen,
  onOpenChange,
  application,
  onTimeLogged,
}: TimeLoggingDialogProps) => {
  const [hours, setHours] = useState(1);
  const [description, setDescription] = useState("");
  
  const { logTime, isLoading } = useAcceptedJobs(onTimeLogged);
  
  const projectTitle = application.business_roles?.project_title || "this project";
  const taskTitle = application.business_roles?.title || "this task";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await logTime(
      application.job_app_id,
      hours,
      description
    );
    
    if (success) {
      setHours(1);
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time for {taskTitle}</DialogTitle>
          <DialogDescription>
            Log the time you've spent working on {projectTitle}. This will be recorded as part of your equity contribution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked</Label>
            <Input
              id="hours"
              type="number"
              min={0.1}
              step={0.1}
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of Work</Label>
            <Textarea
              id="description"
              placeholder="Describe the work you completed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging..." : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
