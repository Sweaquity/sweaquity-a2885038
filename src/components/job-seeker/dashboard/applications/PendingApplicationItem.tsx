
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { WithdrawDialog } from "./WithdrawDialog";
import { AcceptJobDialog } from "./AcceptJobDialog";
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
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{application.business_roles?.title || "Untitled Position"}</h3>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.company_name || "Unknown Company"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
          >
            {isExpanded ? "Less Details" : "More Details"}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <div className="space-y-3">
              <h4 className="font-medium">Job Description</h4>
              <p className="text-sm text-muted-foreground">
                {application.business_roles?.description || "No description available."}
              </p>
              
              {application.message && (
                <div>
                  <h4 className="font-medium mt-3">Your Application Message</h4>
                  <p className="text-sm text-muted-foreground">
                    {application.message}
                  </p>
                </div>
              )}
            </div>
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
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={handleWithdraw}
        isLoading={isWithdrawing}
      />

      <AcceptJobDialog
        isOpen={isAcceptDialogOpen}
        onOpenChange={setIsAcceptDialogOpen}
        onAccept={handleAccept}
        application={application}
      />
    </Card>
  );
};
