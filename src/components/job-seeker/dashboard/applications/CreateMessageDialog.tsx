
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CreateMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  applicationId: string;
  existingMessage?: string;
  onMessageSent?: () => void;
}

export const CreateMessageDialog = ({
  isOpen,
  onOpenChange,
  applicationId,
  existingMessage = "",
  onMessageSent
}: CreateMessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Get the current task_discourse
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Append the new message with a timestamp
      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] Job Seeker: ${message}`;
      
      const updatedDiscourse = application.task_discourse 
        ? `${application.task_discourse}\n\n${newMessage}`
        : newMessage;
        
      // Update the task_discourse field
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', applicationId);
        
      if (updateError) throw updateError;
      
      toast.success("Message sent successfully");
      setMessage("");
      onOpenChange(false);
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message to the project owner about this application.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {existingMessage && (
            <div className="p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{existingMessage}</p>
            </div>
          )}
          
          <Textarea
            placeholder="Type your message here..."
            className="min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSendMessage} 
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
