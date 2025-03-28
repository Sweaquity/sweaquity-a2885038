import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationsList } from "./ApplicationsList";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { PastApplicationsList } from "./PastApplicationsList";
import { EquityProjectsList } from "./EquityProjectsList";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { useWithdrawApplication } from "./hooks/useWithdrawApplication";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";

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
  const { isUpdatingStatus, updateApplicationStatus } = useApplicationActions(onApplicationUpdated);
  const { isWithdrawing, handleWithdrawApplication } = useWithdrawApplication(onApplicationUpdated);
  const { acceptJobAsJobSeeker, isLoading: isAcceptingJob } = useAcceptedJobs(onApplicationUpdated);

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

  // New: Filter Equity Projects
  const activeEquityProjects = useMemo(() => 
    applications.filter(app => 
      app.is_equity_project && 
      (app.status === 'accepted' && app.accepted_business && app.accepted_jobseeker)
    ), 
    [applications]
  );

  const completedEquityProjects = useMemo(() => 
    applications.filter(app => 
      app.is_equity_project && 
      (app.status === 'completed')
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
      // Uncomment if you want to force switch to pending tab
      // setActiveTab("pending");
    }
  }, [pendingCount, activeTab]);

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
        <Alert>
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows applications that are awaiting a response or require your acceptance.
          </AlertDescription>
        </Alert>
        <PendingApplicationsList 
          applications={pendingApplications}
          onWithdraw={handleWithdrawApplication}
          onAccept={acceptJobAsJobSeeker}
          isWithdrawing={isWithdrawing}
        />
      </TabsContent>

      <TabsContent value="current">
        <Alert>
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your active projects where both you and the business have accepted the work agreement.
          </AlertDescription>
        </Alert>
        <ApplicationsList 
          applications={currentApplications}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>

      <TabsContent value="past">
        <Alert>
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your past applications, including rejected and withdrawn projects.
          </AlertDescription>
        </Alert>
        <PastApplicationsList 
          applications={pastApplications}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>

      <TabsContent value="equity">
        <Alert>
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your equity-based projects, both active and completed.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Equity Projects</h3>
            <EquityProjectsList 
              applications={currentApplications}
              onApplicationUpdated={onApplicationUpdated}
              isCompleted={false}

            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Completed Equity Projects</h3>
            {completedEquityProjects.length > 0 ? (
              <EquityProjectsList 
                applications={currentApplications}
                onApplicationUpdated={onApplicationUpdated}
                isCompleted={true}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No completed equity projects yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
