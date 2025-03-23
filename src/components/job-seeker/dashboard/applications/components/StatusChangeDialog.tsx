
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStatus: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const StatusChangeDialog = ({
  isOpen,
  onOpenChange,
  selectedStatus,
  onConfirm,
  isLoading
}: StatusChangeDialogProps) => {
  // Ensure we have a valid status display
  const displayStatus = selectedStatus || "pending";
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Are you sure you want to change the status to "{displayStatus}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
