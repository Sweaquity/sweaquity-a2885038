
import React, { useState } from 'react';
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

export interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason?: string) => Promise<void>;
  isWithdrawing?: boolean;
}

export const WithdrawDialog = ({
  isOpen,
  onOpenChange,
  onWithdraw,
  isWithdrawing = false
}: WithdrawDialogProps) => {
  const [reason, setReason] = useState('');
  
  const handleSubmit = async () => {
    await onWithdraw(reason);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to withdraw your application? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">
            Reason for withdrawing (optional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for withdrawing your application"
            rows={4}
          />
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isWithdrawing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
