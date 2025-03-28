
import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (note: string) => void;
  title: string;
  description: string;
  confirmLabel: string;
  isProcessing: boolean;
}

export const StatusChangeDialog = ({
  isOpen,
  onOpenChange,
  onStatusChange,
  title,
  description,
  confirmLabel,
  isProcessing
}: StatusChangeDialogProps) => {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onStatusChange(note);
    setNote('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Textarea
          placeholder="Provide additional information (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[100px]"
        />
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
