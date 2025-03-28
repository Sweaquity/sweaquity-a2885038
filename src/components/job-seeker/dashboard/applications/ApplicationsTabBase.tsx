
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PendingApplicationsList } from './PendingApplicationsList';
import { AcceptedApplicationsList } from './AcceptedApplicationsList';
import { RejectedApplicationsList } from './RejectedApplicationsList';
import { WithdrawnApplicationsList } from './WithdrawnApplicationsList';
import { JobApplication } from '@/types/jobSeeker';
import { Badge } from '@/components/ui/badge';
import { useApplicationActions } from './hooks/useApplicationActions';
import { useAcceptedJobs } from '@/hooks/useAcceptedJobs';

export interface ApplicationsTabBaseProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  newMessagesCount?: number;
}

export const ApplicationsTabBase = ({
  applications,
  onApplicationUpdated,
  newMessagesCount = 0
}: ApplicationsTabBaseProps) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const { handleWithdrawApplication } = useApplicationActions(onApplicationUpdated);
  const { acceptJobAsJobSeeker, isLoading } = useAcceptedJobs(onApplicationUpdated);
  
  const pendingApplications = applications.filter(app => 
    app.status === 'pending' || (app.status === 'accepted' && !app.accepted_jobseeker)
  );
  
  const acceptedApplications = applications.filter(app => 
    app.status === 'accepted' && app.accepted_jobseeker
  );
  
  const rejectedApplications = applications.filter(app => 
    app.status === 'rejected'
  );
  
  const withdrawnApplications = applications.filter(app => 
    app.status === 'withdrawn'
  );
  
  const handleWithdraw = async (applicationId: string, reason?: string) => {
    setIsWithdrawing(true);
    try {
      await handleWithdrawApplication(applicationId, reason);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingApplications.length > 0 && (
            <Badge className="ml-1 px-1 text-xs" variant="secondary">
              {pendingApplications.length}
            </Badge>
          )}
          {newMessagesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 text-xs h-4 min-w-4" variant="destructive">
              {newMessagesCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="accepted">
          Accepted
          {acceptedApplications.length > 0 && (
            <Badge className="ml-1 px-1 text-xs" variant="secondary">
              {acceptedApplications.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected
          {rejectedApplications.length > 0 && (
            <Badge className="ml-1 px-1 text-xs" variant="secondary">
              {rejectedApplications.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="withdrawn">
          Withdrawn
          {withdrawnApplications.length > 0 && (
            <Badge className="ml-1 px-1 text-xs" variant="secondary">
              {withdrawnApplications.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending">
        <PendingApplicationsList 
          applications={pendingApplications}
          onWithdraw={handleWithdraw}
          onAccept={acceptJobAsJobSeeker}
          isWithdrawing={isWithdrawing}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>
      
      <TabsContent value="accepted">
        <AcceptedApplicationsList 
          applications={acceptedApplications}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>
      
      <TabsContent value="rejected">
        <RejectedApplicationsList 
          applications={rejectedApplications}
        />
      </TabsContent>
      
      <TabsContent value="withdrawn">
        <WithdrawnApplicationsList 
          applications={withdrawnApplications}
        />
      </TabsContent>
    </Tabs>
  );
};
