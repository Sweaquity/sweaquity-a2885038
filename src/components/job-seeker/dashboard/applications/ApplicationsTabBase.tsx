import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingApplicationsList } from './PendingApplicationsList';
import { AcceptedApplicationsList } from './AcceptedApplicationsList';
import { RejectedApplicationsList } from './RejectedApplicationsList';
import { WithdrawnApplicationsList } from './WithdrawnApplicationsList';
import { JobApplication } from '@/types/interfaces';
import { adaptJobApplications } from "@/utils/typeAdapters";

interface ApplicationsTabBaseProps {
  applications: JobApplication[];
  onWithdrawApplication: (applicationId: string, reason?: string) => Promise<void>;
  onAcceptApplication: (application: JobApplication) => Promise<void>;
  viewJobDetails: (application: JobApplication) => void;
  isWithdrawing: boolean;
  onApplicationUpdated: () => void;
}

export const ApplicationsTabBase: React.FC<ApplicationsTabBaseProps> = ({
  applications,
  onWithdrawApplication,
  onAcceptApplication,
  viewJobDetails,
  isWithdrawing,
  onApplicationUpdated
}) => {
  const [activeTab, setActiveTab] = useState("pending");

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const withdrawnApplications = applications.filter(app => app.status === 'withdrawn');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="accepted">Accepted</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
        <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <PendingApplicationsList 
          applications={adaptJobApplications(pendingApplications)} 
          onWithdraw={onWithdrawApplication}
          onAccept={onAcceptApplication}
          isWithdrawing={isWithdrawing}
        />
      </TabsContent>
      
      <TabsContent value="accepted">
        <AcceptedApplicationsList
          applications={adaptJobApplications(acceptedApplications)}
          onViewDetails={viewJobDetails}
        />
      </TabsContent>
      
      <TabsContent value="rejected">
        <RejectedApplicationsList
          applications={adaptJobApplications(rejectedApplications)}
          onViewDetails={viewJobDetails}
        />
      </TabsContent>
      
      <TabsContent value="withdrawn">
        <WithdrawnApplicationsList
          applications={adaptJobApplications(withdrawnApplications)}
          onViewDetails={viewJobDetails}
        />
      </TabsContent>
    </Tabs>
  );
};
