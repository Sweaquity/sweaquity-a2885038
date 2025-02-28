
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Clock,
  Coins,
  FileText,
  Trash2,
  X,
  Loader2
} from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({
  applications,
  onApplicationUpdated
}: ApplicationsListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      setWithdrawing(applicationId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to withdraw an application");
        return;
      }

      // Get the application to find its associated task
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('task_id, user_id')
        .eq('id', applicationId)
        .maybeSingle();
        
      if (appError) {
        console.error("Error fetching application:", appError);
        throw new Error("Could not fetch application details");
      }
      
      // Check if this is the user's application
      if (application?.user_id !== session.user.id) {
        throw new Error("You can only withdraw your own applications");
      }

      // Update the application status
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn' 
        })
        .eq('id', applicationId);
        
      if (updateError) {
        console.error("Error updating application:", updateError);
        throw updateError;
      }
      
      // If we have a task_id, update the task status back to 'open'
      if (application?.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            status: 'open',
            task_status: 'open'
          })
          .eq('id', application.task_id);
          
        if (taskError) {
          console.error("Error updating task status:", taskError);
          // Don't throw here, the application is already withdrawn
        }
      }
      
      toast.success("Application withdrawn successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error(error.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(null);
    }
  };

  if (applications.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          You haven't applied to any positions yet. Browse opportunities to find projects that match your skills.
        </AlertDescription>
      </Alert>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    "in review": "bg-blue-100 text-blue-800",
    negotiation: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Collapsible
          key={application.id}
          open={expandedId === application.id}
          onOpenChange={() => toggleExpand(application.id)}
          className="border rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">
                  {application.business_roles?.title || "Unknown Role"}
                </h3>
                <Badge
                  className={`${
                    statusColors[application.status.toLowerCase()] ||
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {application.status.charAt(0).toUpperCase() +
                    application.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {application.business_roles?.company_name ||
                  application.business_roles?.project_title ||
                  "Unknown Company"}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedId === application.id ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="border-t px-4 py-3 bg-muted/30">
              <div className="grid gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Role Description</h4>
                  <p className="text-sm">
                    {application.business_roles?.description ||
                      "No description provided"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {application.business_roles?.timeframe && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{application.business_roles.timeframe}</span>
                    </div>
                  )}
                  {application.business_roles?.equity_allocation !== undefined && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Coins className="h-4 w-4 mr-1" />
                      <span>
                        {application.business_roles.equity_allocation}% equity
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Application Details
                  </h4>
                  <div className="text-sm">
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-muted-foreground min-w-24">Applied On:</p>
                      <p>
                        {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-muted-foreground min-w-24">CV:</p>
                      <p>
                        {application.cv_url ? (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-primary"
                            onClick={() => window.open(application.cv_url!, "_blank")}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Attached CV
                          </Button>
                        ) : (
                          "No CV attached"
                        )}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <p className="text-muted-foreground min-w-24">Message:</p>
                      <p>
                        {application.message || "No message provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {application.status !== "withdrawn" &&
                  application.status !== "accepted" && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleWithdraw(application.id)}
                        disabled={withdrawing === application.id}
                      >
                        {withdrawing === application.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Withdraw Application
                          </>
                        )}
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};
