import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, X, User, Calendar } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { RejectApplicationDialog } from "./RejectApplicationDialog";
import { StatusBadge } from "@/components/job-seeker/dashboard/applications/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BusinessApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const BusinessApplicationItem = ({ 
  application, 
  onApplicationUpdated 
}: BusinessApplicationItemProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { acceptJobAsBusiness, isLoading } = useAcceptedJobs(onApplicationUpdated);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string = 'User') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleAcceptJob = async () => {
    try {
      await acceptJobAsBusiness(application);
    } catch (error) {
      console.error("Error accepting application:", error);
    }
  };

  const showAcceptButton = 
    application.status === 'accepted' && 
    !application.accepted_business;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary/10">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{application.business_roles?.title || "Unknown Role"}</h3>
              <p className="text-sm text-muted-foreground">
                Applicant ID: {application.id.substring(0, 8)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                Reject Application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Applied On</p>
              <p className="text-sm">{formatDate(application.applied_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={application.status} />
            </div>
          </div>
          
          {application.message && (
            <div>
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm">{application.message}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {showAcceptButton && (
          <Button 
            onClick={handleAcceptJob} 
            disabled={isLoading}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Candidate
          </Button>
        )}
        
        {application.accepted_business && application.accepted_jobseeker ? (
          <Button variant="outline" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Agreement In Place
          </Button>
        ) : application.accepted_business ? (
          <Button disabled variant="outline" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Waiting for Job Seeker
          </Button>
        ) : null}
      </CardFooter>
      
      <RejectApplicationDialog 
        isOpen={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        applicationId={application.job_app_id}
        onReject={onApplicationUpdated}
      />
    </Card>
  );
};
