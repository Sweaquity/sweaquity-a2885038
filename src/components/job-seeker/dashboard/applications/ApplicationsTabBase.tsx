
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
import { supabase } from "@/lib/supabase";

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
  const [applicationsWithEquityData, setApplicationsWithEquityData] = useState<JobApplication[]>([]);

  // Fetch equity data for applications
  useEffect(() => {
    const fetchEquityData = async () => {
      if (applications.length === 0) return;
      
      // Get all job_app_ids
      const jobAppIds = applications.map(app => app.job_app_id);
      
      // Fetch associated accepted_jobs data
      try {
        const { data, error } = await supabase
          .from('accepted_jobs')
          .select('job_app_id, equity_agreed, jobs_equity_allocated')
          .in('job_app_id', jobAppIds);
          
        if (error) {
          console.error("Error fetching equity data:", error);
          return;
        }
        
        // Create a map of job_app_id to equity data
        const equityDataMap = (data || []).reduce((map, item) => {
          map[item.job_app_id] = {
            equity_agreed: item.equity_agreed || 0,
            jobs_equity_allocated: item.jobs_equity_allocated || 0
          };
          return map;
        }, {} as Record<string, any>);
        
        // Merge equity data with applications
        const enrichedApplications = applications.map(app => {
          const equityData = equityDataMap[app.job_app_id];
          
          return {
            ...app,
            is_equity_project: !!equityData,
            accepted_jobs: equityData
          };
        });
        
        setApplicationsWithEquityData(enrichedApplications);
      } catch (err) {
        console.error("Error processing equity data:", err);
      }
    };
    
    fetchEquityData();
  }, [applications]);

  // Filter applications by status type
  const pendingApplications = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.status === 'pending' || 
      (app.status === 'accepted' && app.accepted_business && !app.accepted_jobseeker)
    ), 
    [applicationsWithEquityData]
  );

  const currentApplications = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.status === 'accepted' && app.accepted_business && app.accepted_jobseeker
    ), 
    [applicationsWithEquityData]
  );

  const pastApplications = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'completed'
    ), 
    [applicationsWithEquityData]
  );

  // New: Filter Equity Projects - Active vs Completed based on equity allocation
  const activeEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.is_equity_project && 
      app.status === 'accepted' && 
      app.accepted_business && 
      app.accepted_jobseeker && 
      app.accepted_jobs && 
      app.accepted_jobs.equity_agreed > app.accepted_jobs.jobs_equity_allocated
    ), 
    [applicationsWithEquityData]
  );

  const completedEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.is_equity_project && 
      ((app.status === 'completed') || 
       (app.accepted_jobs && 
        app.accepted_jobs.equity_agreed > 0 && 
        app.accepted_jobs.equity_agreed === app.accepted_jobs.jobs_equity_allocated))
    ), 
    [applicationsWithEquityData]
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
        <Alert variant="default">
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
        <Alert variant="default">
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
        <Alert variant="default">
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
        <Alert variant="default">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your equity-based projects, both active and completed.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Equity Projects</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Projects where you have equity allocation that is still being earned.
            </p>
            <EquityProjectsList 
              applications={activeEquityProjects}
              onApplicationUpdated={onApplicationUpdated}
              isCompleted={false}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Completed Equity Projects</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Projects where 100% of your agreed equity has been allocated.
            </p>
            <EquityProjectsList 
              applications={completedEquityProjects}
              onApplicationUpdated={onApplicationUpdated}
              isCompleted={true}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
