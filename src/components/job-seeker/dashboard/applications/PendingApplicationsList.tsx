import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export const PendingApplicationsList = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing,
}: PendingApplicationsListProps) => {
  const getStatusClasses = (application: JobApplication) => {
    switch (application?.status) {
      case "pending":
        return ["bg-yellow-100", "text-yellow-800"];
      case "accepted":
        return ["bg-green-100", "text-green-800"];
      case "rejected":
        return ["bg-red-100", "text-red-800"];
      default:
        return ["bg-gray-100", "text-gray-800"];
    }
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No pending applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div
          key={application.job_app_id || application.id}
          className="border rounded-md p-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">
                {application.business_roles?.project_title ||
                  "Project Title Unavailable"}
              </h3>
              <p className="text-muted-foreground">
                {application.business_roles?.title || "Role Title Unavailable"}
              </p>
            </div>
            <div>
              <Badge className={getStatusClasses(application).join(" ")}>
                {application.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {onAccept && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAccept(application)}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Accept
              </Button>
            )}

            {onWithdraw && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onWithdraw(application.job_app_id)}
                disabled={isWithdrawing}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
