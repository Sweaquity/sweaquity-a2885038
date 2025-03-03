
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, File, Check, X } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { WithdrawDialog } from "./WithdrawDialog";
import { StatusBadge } from "./StatusBadge";
import { ApplicationHeader } from "./ApplicationHeader";
import { ApplicationContent } from "./ApplicationContent";
import { ApplicationSkills } from "./ApplicationSkills";
import { useWithdrawApplication } from "./hooks/useWithdrawApplication";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => (string | { skill: string; level: string })[];
  onApplicationUpdated?: () => void;
}

export const ApplicationItem = ({
  application,
  getMatchedSkills,
  onApplicationUpdated
}: ApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  
  const {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication
  } = useWithdrawApplication(onApplicationUpdated);

  const { 
    isUpdatingStatus, 
    updateApplicationStatus 
  } = useApplicationActions(onApplicationUpdated);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleStatusChange = (newStatus: string) => {
    updateApplicationStatus(application.job_app_id, newStatus);
  };
  
  const isAccepted = application.status === "accepted";
  const isPending = ["pending", "in review", "negotiation"].includes(application.status.toLowerCase());
  const bothPartiesAccepted = application.accepted_jobseeker && application.accepted_business;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${isExpanded ? "shadow-md" : ""}`}>
      <div className="p-4 cursor-pointer" onClick={handleToggle}>
        <ApplicationHeader
          title={application.business_roles?.title || ""}
          company={application.business_roles?.company_name || ""}
          project={application.business_roles?.project_title || ""}
          status={application.status}
          onWithdrawClick={(e) => {
            e.stopPropagation();
            setIsWithdrawDialogOpen(true);
          }}
        />
      </div>
      
      {isExpanded && (
        <>
          <Separator />
          <CardContent className="p-4 pt-4">
            <ApplicationContent 
              description={application.business_roles?.description || ""}
              timeframe={application.business_roles?.timeframe || ""}
              equityAllocation={application.business_roles?.equity_allocation}
              taskStatus={application.business_roles?.task_status || ""}
              completionPercentage={application.business_roles?.completion_percentage || 0}
            />
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <ApplicationSkills
                requiredSkills={application.business_roles?.skill_requirements || []}
                matchedSkills={getMatchedSkills()}
              />
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Application Status</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {isUpdatingStatus === application.job_app_id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">Updating...</span>
                  </div>
                ) : (
                  <Select 
                    value={application.status} 
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus === application.job_app_id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in review">In Review</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center flex-wrap gap-2">
                  {application.accepted_business && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Business accepted</span>}
                  {application.accepted_jobseeker && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">You have accepted</span>}
                </div>
              </div>
            </div>
            
            {application.task_discourse && (
              <div className="mt-4 p-3 bg-muted/40 rounded-md">
                <h4 className="text-sm font-medium mb-2">Message History</h4>
                <p className="text-sm whitespace-pre-wrap">{application.task_discourse}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              {isAccepted && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAcceptDialogOpen(true);
                  }}
                  variant={bothPartiesAccepted ? "default" : "outline"}
                  className={bothPartiesAccepted ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {bothPartiesAccepted ? "Manage Contract" : (application.accepted_jobseeker ? "Accepted ✓" : "Accept Job")}
                  {!bothPartiesAccepted && application.accepted_jobseeker && <Check className="ml-1 h-4 w-4" />}
                </Button>
              )}
              
              {isPending && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMessageDialogOpen(true);
                    }}
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Message
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsWithdrawDialogOpen(true);
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Withdraw
                  </Button>
                </>
              )}
              
              {(application.cv_url || application.message) && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={application.cv_url || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <File className="mr-1 h-4 w-4" />
                    View CV
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </>
      )}
      
      {isMessageDialogOpen && (
        <CreateMessageDialog
          isOpen={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          applicationId={application.job_app_id}
          existingMessage={application.task_discourse || ""}
          onMessageSent={onApplicationUpdated}
        />
      )}
      
      {isWithdrawDialogOpen && (
        <WithdrawDialog
          isOpen={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          onWithdraw={(reason) => handleWithdrawApplication(application.job_app_id, reason)}
          isWithdrawing={isWithdrawing}
        />
      )}
      
      {isAcceptDialogOpen && (
        <AcceptJobDialog
          isOpen={isAcceptDialogOpen}
          onClose={() => setIsAcceptDialogOpen(false)}
          application={application}
          onApplicationUpdated={onApplicationUpdated}
          isJobSeeker={true}
        />
      )}
    </Card>
  );
};
