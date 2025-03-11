
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CreateMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage?: (message: string) => Promise<void>;
  applicationId?: string;
  existingMessage?: string;
  onMessageSent?: () => void;
}

export const CreateMessageDialog = ({
  isOpen,
  onOpenChange,
  onSendMessage,
  applicationId,
  existingMessage = "",
  onMessageSent
}: CreateMessageDialogProps) => {
  const [message, setMessage] = useState(existingMessage || "");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && existingMessage) {
      setMessage(existingMessage);
    }
  }, [isOpen, existingMessage]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      setIsSending(true);
      
      if (onSendMessage) {
        await onSendMessage(message);
      } else if (applicationId) {
        // If no onSendMessage provided but applicationId is available, handle directly
        const { data: applicationData, error: fetchError } = await supabase
          .from('job_applications')
          .select('task_discourse')
          .eq('job_app_id', applicationId)
          .single();
          
        if (fetchError) throw fetchError;
        
        const timestamp = new Date().toLocaleString();
        const newMessage = `[${timestamp}] Job Seeker: ${message}`;
        
        const updatedDiscourse = applicationData.task_discourse 
          ? `${applicationData.task_discourse}\n\n${newMessage}`
          : newMessage;
          
        const { error: updateError } = await supabase
          .from('job_applications')
          .update({ task_discourse: updatedDiscourse })
          .eq('job_app_id', applicationId);
          
        if (updateError) throw updateError;
        
        if (onMessageSent) {
          onMessageSent();
        }
        
        toast.success("Message sent successfully");
      }
      
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-[100px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || !message.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>Send Message</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
