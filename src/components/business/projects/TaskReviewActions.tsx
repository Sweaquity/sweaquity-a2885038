
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface TaskReviewActionsProps {
  onApprove: () => void;
  onRequestChanges: () => void;
}

export const TaskReviewActions = ({ onApprove, onRequestChanges }: TaskReviewActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="destructive" 
        onClick={onRequestChanges}
        size="sm"
      >
        <X className="w-4 h-4 mr-1" /> Request Changes
      </Button>
      <Button 
        variant="default"
        onClick={onApprove}
        size="sm"
      >
        <Check className="w-4 h-4 mr-1" /> Approve Task
      </Button>
    </div>
  );
};
