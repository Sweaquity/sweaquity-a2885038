
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { WithdrawDialog } from './WithdrawDialog';
import { JobApplication } from '@/types/jobSeeker';
import { ApplicationItemHeader } from './components/ApplicationItemHeader';
import { ApplicationItemContent } from './components/ApplicationItemContent';

interface PendingApplicationItemProps {
  application: JobApplication;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export function PendingApplicationItem({
  application,
  onWithdraw,
  onAccept,
  isWithdrawing = false
}: PendingApplicationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isBusinessAccepted, setIsBusinessAccepted] = useState(false);
  const [isJobSeekerAccepted, setIsJobSeekerAccepted] = useState(false);
  
  useEffect(() => {
    setIsBusinessAccepted(!!application.accepted_business);
    setIsJobSeekerAccepted(!!application.accepted_jobseeker);
  }, [application]);
  
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };
  
  const handleWithdraw = async (reason?: string) => {
    if (onWithdraw) {
      await onWithdraw(application.job_app_id, reason);
      setShowWithdrawDialog(false);
    }
  };
  
  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(application);
    }
  };
  
  const isPending = application.status === 'pending';
  const isWaitingForJobSeekerAcceptance = application.status === 'accepted' && isBusinessAccepted && !isJobSeekerAccepted;
  
  return (
    <Card className={`mb-4 cursor-pointer border ${isWaitingForJobSeekerAcceptance ? 'border-blue-200 bg-blue-50' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <ApplicationItemHeader
              title={application.business_roles?.title}
              company={application.business_roles?.company_name}
              project={application.business_roles?.project_title}
              status={application.status}
              date={getTimeAgo(application.applied_at)}
              showStatus={!isWaitingForJobSeekerAcceptance}
            />
            
            {isWaitingForJobSeekerAcceptance && (
              <div className="mt-2 mb-4">
                <Badge className="bg-blue-500">Business has accepted your application</Badge>
                <p className="text-sm mt-1">
                  Congratulations! The business has accepted your application. Please review and accept to proceed.
                </p>
              </div>
            )}
            
            {isExpanded && (
              <div className="mt-4">
                <ApplicationItemContent
                  description={application.business_roles?.description}
                  message={application.message}
                  discourse={application.task_discourse}
                  appliedAt={application.applied_at}
                />
              </div>
            )}
          </div>
          
          <div className="flex md:flex-col justify-between mt-4 md:mt-0 md:ml-4 gap-2">
            {isWaitingForJobSeekerAcceptance ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept();
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="mr-1 h-4 w-4" />
                Accept Job
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                disabled={!isPending}
              >
                {isPending ? 'Pending' : application.status}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowWithdrawDialog(true);
              }}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>
      </CardContent>
      
      <WithdrawDialog
        isOpen={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        onWithdraw={handleWithdraw}
        isLoading={isWithdrawing}
      />
    </Card>
  );
}
