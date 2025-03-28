
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface MessageActionsProps {
  onMessageSend?: () => void;
}

export const MessageActions = ({ onMessageSend }: MessageActionsProps) => {
  const handleMessage = () => {
    if (onMessageSend) {
      onMessageSend();
    } else {
      toast.info("Messaging feature coming soon");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleMessage}>
      <MessageSquare className="h-4 w-4 mr-1" />
      Send Message
    </Button>
  );
};
