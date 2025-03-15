
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { useWithdrawApplication } from "./hooks/useWithdrawApplication";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, FileText, MessageSquare, TimerIcon } from "lucide-react";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { TimeLoggingDialog } from "./TimeLoggingDialog";
import { StatusBadge } from "./StatusBadge";
import { StatusChangeDialog } from "./components/StatusChangeDialog";
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectInfo } from "./components/ProjectInfo";
import { MessageActions } from "./components/MessageActions";
import { ApplicationStatus } from "./components/ApplicationStatus";

interface EquityProjectItemProps {
  application: JobApplication;
  onApplicationUpdated?: () => void;
}

export const EquityProjectItem = ({
  application,
  onApplicationUpdated,
}: EquityProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateMessageOpen, setIsCreateMessageOpen] = useState(false);
  const [isTimeLoggingOpen, setIsTimeLoggingOpen] = useState(false);
  const [isAcceptJobDialogOpen, setIsAcceptJobDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(application.status);

  const {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication,
  } = useWithdrawApplication(onApplicationUpdated);

  const { isUpdatingStatus, updateApplicationStatus } =
    useApplicationActions(onApplicationUpdated);

  const { acceptJobAsJobSeeker, isLoading: isAcceptingJob } = useAcceptedJobs(
    onApplicationUpdated
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleWithdraw = async (reason?: string) => {
    await handleWithdrawApplication(application.job_app_id, reason);
    return Promise.resolve();
  };

  const handleStatusChange = (status: string) => {
    if (status === "withdrawn") {
      setIsWithdrawDialogOpen(true);
      return;
    }

    setSelectedStatus(status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    await updateApplicationStatus(application.job_app_id, selectedStatus);
    setStatusDialogOpen(false);
  };

  const handleAcceptJob = async () => {
    await acceptJobAsJobSeeker(application);
    if (onApplicationUpdated) onApplicationUpdated();
  };

  const showAcceptButton =
    application.status === "accepted" && !application.accepted_jobseeker;

  const isFullyAccepted =
    application.accepted_jobseeker && application.accepted_business;

  return (
    <Card className="overflow-hidden bg-card">
      <CardHeader className="p-4 pb-0">
        <ProjectHeader
          application={application}
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
        />
      </CardHeader>

      <CardContent className={`p-4 ${isExpanded ? "pb-0" : ""}`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <ProjectInfo
            title={application.business_roles?.title}
            description={application.business_roles?.description}
            projectTitle={application.business_roles?.project_title}
            companyName={application.business_roles?.company_name}
          />

          <div className="flex flex-col justify-between items-end gap-2">
            <div className="flex items-center gap-2">
              <ApplicationStatus status={application.status} />
              {isFullyAccepted && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Active Project
                </Badge>
              )}
            </div>

            {application.business_roles?.equity_allocation && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Equity Allocation
                </div>
                <div className="font-semibold text-lg">
                  {application.business_roles.equity_allocation}%
                </div>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Timeframe
                </h3>
                <p>{application.business_roles?.timeframe || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Completion
                </h3>
                <p>
                  {application.business_roles?.completion_percentage
                    ? `${application.business_roles.completion_percentage}%`
                    : "0%"}
                </p>
              </div>

              {application.business_roles?.skill_requirements && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.business_roles.skill_requirements.map(
                      (skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-2 py-1"
                        >
                          {typeof skill === "string"
                            ? skill
                            : `${skill.skill} (${skill.level})`}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {application.task_discourse && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Message History
                  </h3>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm">
                    {application.task_discourse}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex flex-wrap gap-2 justify-end">
              <MessageActions
                onMessageClick={() => setIsCreateMessageOpen(true)}
                onWithdrawClick={() => setIsWithdrawDialogOpen(true)}
              />

              {isFullyAccepted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTimeLoggingOpen(true)}
                >
                  <TimerIcon className="mr-1 h-4 w-4" />
                  Log Time
                </Button>
              )}

              {showAcceptButton && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsAcceptJobDialogOpen(true)}
                  disabled={isAcceptingJob}
                >
                  {isAcceptingJob ? "Processing..." : "Accept Job"}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CreateMessageDialog
        isOpen={isCreateMessageOpen}
        onOpenChange={setIsCreateMessageOpen}
        applicationId={application.job_app_id}
        existingMessage={application.task_discourse}
        onMessageSent={onApplicationUpdated}
      />

      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />

      <StatusChangeDialog
        isOpen={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        selectedStatus={selectedStatus}
        onConfirm={confirmStatusChange}
        isLoading={isUpdatingStatus === application.job_app_id}
      />

      <AcceptJobDialog
        isOpen={isAcceptJobDialogOpen}
        onOpenChange={setIsAcceptJobDialogOpen}
        application={application}
        onAccept={handleAcceptJob}
        isLoading={isAcceptingJob}
      />

      <TimeLoggingDialog
        isOpen={isTimeLoggingOpen}
        onOpenChange={setIsTimeLoggingOpen}
        application={application}
        onTimeLogged={onApplicationUpdated}
      />
    </Card>
  );
};
