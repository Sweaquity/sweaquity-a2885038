
import { JobApplication, PendingApplicationsListProps } from "@/types/jobSeeker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "./components/ApplicationStatus";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export const PendingApplicationsList = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing = false
}: PendingApplicationsListProps) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawingApplication, setWithdrawingApplication] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [expandedApplications, setExpandedApplications] = useState<Record<string, boolean>>({});

  const toggleApplicationExpand = (applicationId: string) => {
    setExpandedApplications(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const handleWithdrawClick = (applicationId: string) => {
    setWithdrawingApplication(applicationId);
    setWithdrawReason('');
    setIsWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawingApplication || !onWithdraw) return;
    
    try {
      await onWithdraw(withdrawingApplication, withdrawReason);
      toast.success("Application withdrawn successfully");
    } catch (error) {
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawDialogOpen(false);
      setWithdrawingApplication(null);
      setWithdrawReason('');
    }
  };

  const handleAcceptApplication = async (application: JobApplication) => {
    if (!onAccept) return;
    
    try {
      await onAccept(application);
      toast.success("Job accepted successfully");
    } catch (error) {
      toast.error("Failed to accept job");
    }
  };

  const getTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  const renderApplicationDetails = (application: JobApplication) => {
    const isExpanded = expandedApplications[application.job_app_id] || false;
    const showAcceptButton = application.status === 'accepted' && 
                            application.accepted_business && 
                            !application.accepted_jobseeker;
                            
    return (
      <Card key={application.job_app_id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg">
                {application.business_roles?.title || "Untitled Position"}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {application.business_roles?.company_name || "Unknown Company"} | Project: {application.business_roles?.project_title || "Unknown Project"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Applied: {getTimeAgo(application.applied_at)}
              </div>
            </div>
            
            <ApplicationStatus
              isExpanded={isExpanded}
              toggleExpand={() => toggleApplicationExpand(application.job_app_id)}
              status={application.status}
              onStatusChange={() => {}} // Read-only in this view
              isUpdatingStatus={false}
              showAcceptButton={showAcceptButton}
              onAcceptClick={() => handleAcceptApplication(application)}
              isAcceptingJob={false}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <div className="text-xs font-medium">Project Status</div>
              <div className="text-sm">{application.business_roles?.task_status || "pending"}</div>
            </div>
            <div>
              <div className="text-xs font-medium">Timeframe</div>
              <div className="text-sm">{application.business_roles?.timeframe || "Not specified"}</div>
            </div>
            <div>
              <div className="text-xs font-medium">Equity</div>
              <div className="text-sm">{application.business_roles?.equity_allocation ? `${application.business_roles.equity_allocation}%` : "Not specified"}</div>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-4 border-t pt-4">
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Skills Required</div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(application.business_roles?.skill_requirements) && 
                   application.business_roles?.skill_requirements.map((skill, index) => {
                      const skillName = typeof skill === 'string' ? skill : skill.skill;
                      const level = typeof skill === 'string' ? 'Intermediate' : skill.level;
                      
                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skillName} <span className="ml-1 opacity-70">({level})</span>
                        </Badge>
                      );
                    })}
                    
                  {(!application.business_roles?.skill_requirements || 
                    application.business_roles.skill_requirements.length === 0) && 
                    <span className="text-muted-foreground text-xs">No skills specified</span>
                  }
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Project Description</div>
                <div className="text-sm text-muted-foreground">
                  {application.business_roles?.description || "No description provided"}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Your Message</div>
                <div className="text-sm text-muted-foreground">
                  {application.message || "No message provided with this application"}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleWithdrawClick(application.job_app_id)}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing && withdrawingApplication === application.job_app_id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Withdraw Application
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <h3 className="text-lg font-medium">No Pending Applications</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any pending applications right now.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        applications.map(application => renderApplicationDetails(application))
      )}
      
      <AlertDialog 
        open={isWithdrawDialogOpen} 
        onOpenChange={setIsWithdrawDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-2">
            <label htmlFor="withdrawReason" className="text-sm font-medium">
              Reason for withdrawal (optional):
            </label>
            <Textarea
              id="withdrawReason"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="Please provide a reason for withdrawing your application"
              className="mt-1"
            />
          </div>
          
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawConfirm}
              disabled={isWithdrawing}
            >
              {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
