
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface StatusChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStatus: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function StatusChangeDialog({
  isOpen,
  onOpenChange,
  selectedStatus,
  onConfirm,
  isLoading,
}: StatusChangeDialogProps) {
  // Ensure we never have an empty status
  const safeStatus = selectedStatus || "pending";
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Status Change</DialogTitle>
          <DialogDescription>
            Are you sure you want to change the application status to {safeStatus}?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup defaultValue={safeStatus} className="gap-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="negotiation" id="negotiation" />
            <Label htmlFor="negotiation">Negotiation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="accepted" id="accepted" />
            <Label htmlFor="accepted">Accepted</Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StatusChangeDialog;
