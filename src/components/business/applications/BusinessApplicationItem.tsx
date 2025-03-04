
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, User, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";

interface BusinessApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const BusinessApplicationItem = ({ 
  application, 
  onApplicationUpdated 
}: BusinessApplicationItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  const { 
    acceptJobAsBusiness,
    isLoading: isAcceptingJob 
  } = useAcceptedJobs(onApplicationUpdated);
  
  const handleAcceptApplication = async () => {
    try {
      await acceptJobAsBusiness(application);
      
      // Update task_discourse with acceptance message
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to accept candidates");
        return;
      }

      // Get existing discourse
      const { data: applicationData, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', application.job_app_id)
        .single();

      if (fetchError) {
        console.error("Error fetching discourse:", fetchError);
        return;
      }

      // Format the message with timestamp and sender
      const timestamp = new Date().toLocaleString();
      const formattedMessage = `[${timestamp}] Business: I have accepted this candidate for the role.`;

      // Append to existing discourse or create new
      const updatedDiscourse = applicationData?.task_discourse
        ? `${applicationData.task_discourse}\n\n${formattedMessage}`
        : formattedMessage;

      // Update the application with the new discourse
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          task_discourse: updatedDiscourse,
          status: 'accepted' 
        })
        .eq('job_app_id', application.job_app_id);

      if (updateError) {
        console.error("Error updating discourse:", updateError);
      }
      
      setAcceptDialogOpen(false);
      onApplicationUpdated();
    } catch (error) {
      console.error("Error accepting candidate:", error);
      toast.error("Failed to accept candidate");
    }
  };
  
  // Only show accept button for applications with 'accepted' status that haven't been accepted by business yet
  const showAcceptButton = application.status === 'accepted' && !application.accepted_business;
  
  const dateApplied = new Date(application.applied_at).toLocaleDateString();
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{application.business_roles?.title || "Untitled Role"}</CardTitle>
          <p className="text-sm text-muted-foreground">Applied on {dateApplied}</p>
        </div>
        <Badge 
          variant={
            application.status === 'rejected' ? 'destructive' :
            application.status === 'accepted' ? 'success' :
            'secondary'
          }
        >
          {application.status}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Applicant ID: {application.id}</span>
        </div>
        
        {application.message && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Cover Message:</h4>
            <p className="text-sm text-muted-foreground">{application.message}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show Less" : "Show More"}
          </Button>
          
          {expanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement message handling */}}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          )}
          
          {showAcceptButton && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setAcceptDialogOpen(true)}
              disabled={isAcceptingJob}
            >
              <Check className="mr-2 h-4 w-4" />
              Accept Candidate
            </Button>
          )}
        </div>
        
        {expanded && application.task_discourse && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Communication History:</h4>
            <pre className="text-xs whitespace-pre-wrap">{application.task_discourse}</pre>
          </div>
        )}
      </CardContent>
      
      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Candidate</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this candidate for the role?
              This will notify the candidate that they have been accepted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptApplication}
              disabled={isAcceptingJob}
            >
              {isAcceptingJob ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Candidate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
