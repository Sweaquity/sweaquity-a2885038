
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onMessageSent?: () => void;
}

export const CreateMessageDialog = ({
  isOpen,
  onOpenChange,
  applicationId,
  onMessageSent
}: CreateMessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);
    try {
      const { data: currentApp, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
      
      if (fetchError) throw fetchError;

      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] You: ${message}`;
      const updatedDiscourse = currentApp.task_discourse 
        ? `${currentApp.task_discourse}\n\n${newMessage}`
        : newMessage;

      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', applicationId);
      
      if (updateError) throw updateError;

      toast.success("Message sent successfully");
      setMessage("");
      onOpenChange(false);
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to the project owner regarding this task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-left">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-32"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
