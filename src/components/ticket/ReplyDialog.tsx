import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendReply: (message: string) => Promise<void>;
}

export const ReplyDialog: React.FC<ReplyDialogProps> = ({
  isOpen,
  onOpenChange,
  onSendReply
}) => {
  const [replyMessage, setReplyMessage] = useState('');

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    await onSendReply(replyMessage);
    setReplyMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reply to Reporter</DialogTitle>
          <DialogDescription>
            Your message will be sent to the user who reported this issue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Write your reply here..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setReplyMessage('');
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSendReply}>Send Reply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
