
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationsList } from "./ApplicationsList";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { PastApplicationsList } from "./PastApplicationsList";
import { EquityProjectsList } from "./EquityProjectsList";
import { useApplicationActions } from "./hooks/useApplicationActions";

interface ApplicationsTabBaseProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  newMessagesCount?: number;
}

export const ApplicationsTabBase = ({
  applications,
  onApplicationUpdated,
  newMessagesCount
}: ApplicationsTabBaseProps) => {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const { handleWithdrawApplication, handleAcceptJob, withdrawLoading } = useApplicationActions(onApplicationUpdated);

  // Filter applications by status type
  const pendingApplications = useMemo(() => 
    applications.filter(app => 
      app.status === 'pending' || 
      (app.status === 'accepted' && app.accepted_business && !app.accepted_jobseeker)
    ), 
    [applications]
  );

  const currentApplications = useMemo(() => 
    applications.filter(app => 
      app.status === 'accepted' && app.accepted_business && app.accepted_jobseeker
    ), 
    [applications]
  );

  const pastApplications = useMemo(() => 
    applications.filter(app => 
      app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'completed'
    ), 
    [applications]
  );

  // Count notifications for tabs
  const pendingCount = pendingApplications.filter(app => 
    app.status === 'accepted' && app.accepted_business && !app.accepted_jobseeker
  ).length;

  const messagesCount = newMessagesCount || 0;

  useEffect(() => {
    if (pendingCount > 0 && activeTab !== "pending") {
      //setActiveTab("pending");
    }
  }, [pendingCount]);

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium">No Applications Yet</h3>
            <p className="text-muted-foreground mt-2">
              You haven't applied to any projects yet. Check out the Opportunities tab to find projects to apply for.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="current" className="relative">
          Current
          {messagesCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
              {messagesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="equity">Equity</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <PendingApplicationsList 
          applications={pendingApplications} 
          onWithdraw={handleWithdrawApplication}
          onAccept={handleAcceptJob}
          isWithdrawing={withdrawLoading}
        />
      </TabsContent>

      <TabsContent value="current">
        <ApplicationsList 
          applications={currentApplications}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>

      <TabsContent value="past">
        <PastApplicationsList applications={pastApplications} />
      </TabsContent>

      <TabsContent value="equity">
        <EquityProjectsList applications={currentApplications} />
      </TabsContent>
    </Tabs>
  );
};
