
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { ApplicationContent } from "./ApplicationContent";
import { ApplicationHeader } from "./ApplicationHeader";
import { JobApplication } from "@/types/jobSeeker";

export interface PendingApplicationItemProps {
  application: JobApplication;
  onWithdraw: (applicationId: string, reason?: string) => Promise<void>;
  onAccept: (application: JobApplication) => Promise<void>;
  isWithdrawing: boolean;
}

export const PendingApplicationItem = ({
  application,
  onWithdraw,
  onAccept,
  isWithdrawing
}: PendingApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);

  const handleAccept = async () => {
    try {
      await onAccept(application);
      setIsAcceptDialogOpen(false);
    } catch (error) {
      console.error("Error accepting application:", error);
    }
  };

  const handleWithdraw = async (reason?: string) => {
    try {
      await onWithdraw(application.job_app_id, reason);
      setIsWithdrawDialogOpen(false);
    } catch (error) {
      console.error("Error withdrawing application:", error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <ApplicationHeader
          application={application}
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
        />

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <ApplicationContent application={application} />
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center mt-4 space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={application.status} />
            <span className="text-sm text-muted-foreground">
              Applied: {new Date(application.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWithdrawDialogOpen(true)}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAcceptDialogOpen(true)}
            >
              Accept
            </Button>
          </div>
        </div>
      </CardContent>

      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onClose={() => setIsWithdrawDialogOpen(false)}
        onWithdraw={handleWithdraw}
        isLoading={isWithdrawing}
      />

      <AcceptJobDialog
        isOpen={isAcceptDialogOpen}
        onClose={() => setIsAcceptDialogOpen(false)}
        onAccept={handleAccept}
        application={application}
      />
    </Card>
  );
};
