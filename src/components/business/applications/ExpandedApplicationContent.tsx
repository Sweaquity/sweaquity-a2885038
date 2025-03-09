
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, MessageCircle } from "lucide-react";
import { Application } from "@/types/business";
import { AcceptedJob } from "@/hooks/jobs/useAcceptedJobsCore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ContractActionsSection } from "./ContractActionsSection";

interface ExpandedApplicationContentProps {
  application: Application;
  acceptedJob: AcceptedJob | null;
  onUpdate: () => void;
}

export const ExpandedApplicationContent = ({
  application,
  acceptedJob,
  onUpdate
}: ExpandedApplicationContentProps) => {
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setSendingMessage(true);
      const { data: applicationData, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', application.job_app_id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] Business: ${message}`;
      
      const updatedDiscourse = applicationData.task_discourse 
        ? `${applicationData.task_discourse}\n\n${newMessage}`
        : newMessage;
        
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', application.job_app_id);
        
      if (updateError) throw updateError;
      
      setMessage("");
      toast.success("Message sent successfully");
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };
  
  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Application Message */}
      {application.message && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Application Message:</h4>
          <div className="bg-muted/30 p-3 rounded-md text-sm">
            {application.message}
          </div>
        </div>
      )}
      
      {/* CV Link */}
      {application.cv_url && (
        <div>
         {application.cv_url && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewApplicationCV(application.cv_url!);
                        }}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Download Application CV
                      </Button>
                    </div>
                  )}
        </div>
      )}
      
      {/* Communication History */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Communication History:</h4>
        <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
          {application.task_discourse ? (
            <div className="space-y-2 text-xs">
              {application.task_discourse.split('\n\n').map((msg, i) => {
                const isBusinessMsg = msg.includes('Business:');
                return (
                  <div 
                    key={i} 
                    className={`p-2 rounded-md ${
                      isBusinessMsg 
                        ? 'bg-blue-50 border-blue-200 border ml-4' 
                        : 'bg-gray-100 border-gray-200 border mr-4'
                    }`}
                  >
                    {msg}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No messages yet</p>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Textarea 
            placeholder="Type a message..." 
            className="text-sm resize-none h-10 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage} 
            disabled={sendingMessage || !message.trim()}
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Contract Management Section - only shown when both parties accepted */}
      {application.accepted_business && application.accepted_jobseeker && (
        <ContractActionsSection 
          application={application}
          acceptedJob={acceptedJob}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};
