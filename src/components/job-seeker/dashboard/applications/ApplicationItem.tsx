
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  MessageSquare,
  BadgeAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ApplicationItemContent } from "./ApplicationItemContent";
import { WithdrawApplicationDialog } from "./WithdrawApplicationDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/types";
import { MessageApplicationDialog } from "./MessageApplicationDialog";

interface ApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const ApplicationItem = ({ application, onApplicationUpdated }: ApplicationItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const getProjectTitle = () => {
    if (application.business_roles?.project_title) {
      return application.business_roles.project_title;
    }
    return "Unnamed Project";
  };

  const getCompanyName = () => {
    if (application.business_roles?.company_name) {
      return application.business_roles.company_name;
    }
    return "Company";
  };

  const getTaskTitle = () => {
    if (application.business_roles?.title) {
      return application.business_roles.title;
    }
    return "Task";
  };

  const getDescription = () => {
    if (application.business_roles?.description) {
      return application.business_roles.description;
    }
    return "No description available";
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleWithdraw = async (reason?: string) => {
    try {
      setIsWithdrawing(true);
      
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          notes: reason ? [...(application.notes || []), {
            type: 'withdrawal',
            content: reason,
            timestamp: new Date().toISOString()
          }] : application.notes
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("Application withdrawn successfully");
      onApplicationUpdated();
      setShowWithdrawDialog(false);
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      setIsSending(true);
      // Get the current discourse
      const currentDiscourse = application.task_discourse || '';
      
      // Format the new message with timestamp and add it to the discourse
      const now = new Date();
      const timestamp = now.toISOString();
      const newMessage = `\n[${timestamp}] Job Seeker: ${message}`;
      const updatedDiscourse = currentDiscourse + newMessage;
      
      // Update the application with the new discourse
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          task_discourse: updatedDiscourse,
          updated_at: now.toISOString()
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("Message sent");
      setShowMessageDialog(false);
      onApplicationUpdated();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mb-4">
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{getTaskTitle()}</h3>
              <p className="text-sm text-muted-foreground">
                {getCompanyName()} | {getProjectTitle()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant={application.status === 'accepted' ? "default" : "outline"}
                className={application.status === 'accepted' ? "bg-green-500" : ""}
              >
                {application.status === 'accepted' ? 'Accepted' : application.status}
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleToggleExpand}
              >
                {expanded ? 
                  <span className="text-xs">Collapse</span> : 
                  <span className="text-xs">Expand</span>
                }
              </Button>
            </div>
          </div>
          
          {expanded && (
            <div className="mt-4 border-t pt-4">
              <ApplicationItemContent 
                description={getDescription()}
                message={application.message || ""}
                discourse={application.task_discourse || ""}
                appliedAt={formatDate(application.applied_at)}
                onMessageClick={() => setShowMessageDialog(true)}
                onWithdrawClick={() => setShowWithdrawDialog(true)}
                onViewProject={() => console.log("View Project clicked")}
              />
            </div>
          )}
        </div>
      </Card>
      
      <WithdrawApplicationDialog
        open={showWithdrawDialog}
        onClose={() => setShowWithdrawDialog(false)}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />
      
      <MessageApplicationDialog
        open={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
};
