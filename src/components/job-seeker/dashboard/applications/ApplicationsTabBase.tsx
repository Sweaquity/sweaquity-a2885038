import { useState, useEffect, useMemo, useCallback } from "react";
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
  const [isLoadingEquityData, setIsLoadingEquityData] = useState(false);

  // 🔧 FIX: Memoize the equity data fetching to prevent infinite loops
  const fetchEquityData = useCallback(async (apps: JobApplication[]) => {
    if (apps.length === 0) {
      console.log("No applications to fetch equity data for");
      setApplicationsWithEquityData([]);
      return;
    }
    
    setIsLoadingEquityData(true);
    console.log("Fetching equity data for", apps.length, "applications");
    
    // Get all job_app_ids
    const jobAppIds = apps
      .map(app => app.job_app_id)
      .filter(id => id); // Remove any undefined/null ids
    
    if (jobAppIds.length === 0) {
      console.log("No valid job_app_ids found");
      setApplicationsWithEquityData(apps);
      setIsLoadingEquityData(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('accepted_jobs')
        .select('job_app_id, equity_agreed, jobs_equity_allocated, date_accepted, id')
        .in('job_app_id', jobAppIds);
        
      if (error) {
        console.error("Error fetching equity data:", error);
        setApplicationsWithEquityData(apps);
        setIsLoadingEquityData(false);
        return;
      }
      
      console.log("Equity data fetched:", data?.length || 0, "records");
      
      // Create a map of job_app_id to equity data
      const equityDataMap = (data || []).reduce((map, item) => {
        map[item.job_app_id] = {
          equity_agreed: item.equity_agreed || 0,
          jobs_equity_allocated: item.jobs_equity_allocated || 0,
          date_accepted: item.date_accepted,
          id: item.id
        };
        return map;
      }, {} as Record<string, any>);
      
      // 🔧 FIX: Use JSON.stringify to compare and prevent unnecessary updates
      const enrichedApplications = apps.map(app => {
        const equityData = equityDataMap[app.job_app_id];
        
        return {
          ...app,
          hasEquityData: !!equityData,
          accepted_jobs: equityData
        };
      });
      
      // Only update if the data has actually changed
      setApplicationsWithEquityData(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(enrichedApplications);
        if (hasChanged) {
          console.log("Equity data updated - applications changed");
          return enrichedApplications;
        }
        console.log("Equity data unchanged - skipping update");
        return prev;
      });
      
    } catch (err) {
      console.error("Error processing equity data:", err);
      setApplicationsWithEquityData(apps);
    } finally {
      setIsLoadingEquityData(false);
    }
  }, []); // Empty dependency array since it doesn't depend on props/state

  // 🔧 FIX: Only fetch equity data when applications actually change
  useEffect(() => {
    // Create a stable identifier for the applications array
    const applicationsHash = applications
      .map(app => `${app.job_app_id}-${app.status}-${app.accepted_business}-${app.accepted_jobseeker}`)
      .join('|');
    
    const lastHashRef = { current: '' };
    
    if (lastHashRef.current !== applicationsHash) {
      lastHashRef.current = applicationsHash;
      fetchEquityData(applications);
    }
  }, [applications, fetchEquityData]);

  // Helper function to filter applications by status
  const getApplicationsByStatus = useCallback((statusArray: string[]) => {
    return applicationsWithEquityData.filter(app => {
      const status = app.status?.toLowerCase() || '';
      return statusArray.map(s => s.toLowerCase()).includes(status);
    });
  }, [applicationsWithEquityData]);

  // 🔧 FIX: Add proper dependency array and memoization
  const pendingApplications = useMemo(() => {
    if (isLoadingEquityData) return [];
    const applications = getApplicationsByStatus(['pending', 'in review']);
    return applications;
  }, [getApplicationsByStatus, isLoadingEquityData]);

  const negotiationApplications = useMemo(() => {
    if (isLoadingEquityData) return [];
    return getApplicationsByStatus(['negotiation']);
  }, [getApplicationsByStatus, isLoadingEquityData]);

  // Current applications - accepted jobs that are active
  const currentApplications = useMemo(() => {
    if (isLoadingEquityData) return [];
    const acceptedApps = getApplicationsByStatus(['accepted']);
    
    // Filter to only show accepted jobs that are still active (not fully completed equity-wise)
    const activeAccepted = acceptedApps.filter(app => {
      // If no equity data, consider it active
      if (!app.accepted_jobs) return true;
      
      // If equity is agreed but not fully allocated, it's active
      const equityAgreed = app.accepted_jobs.equity_agreed || 0;
      const equityAllocated = app.accepted_jobs.jobs_equity_allocated || 0;
      
      return equityAgreed === 0 || equityAgreed > equityAllocated;
    });
    
    return activeAccepted;
  }, [getApplicationsByStatus, isLoadingEquityData]);

  const pastApplications = useMemo(() => {
    if (isLoadingEquityData) return [];
    const withdrawnAndRejected = [
      ...getApplicationsByStatus(['withdrawn']),
      ...getApplicationsByStatus(['rejected'])
    ];
    
    return withdrawnAndRejected;
  }, [getApplicationsByStatus, isLoadingEquityData]);

  // All pending and negotiation applications for the pending tab
  const allPendingApplications = useMemo(() => {
    return [...pendingApplications, ...negotiationApplications];
  }, [pendingApplications, negotiationApplications]);

  // Filter Equity Projects - Active vs Completed based on equity allocation
  const activeEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.hasEquityData && 
      app.status?.toLowerCase() === 'accepted' && 
      app.accepted_jobs && 
      app.accepted_jobs.equity_agreed > app.accepted_jobs.jobs_equity_allocated
    ), 
    [applicationsWithEquityData]
  );

  // Completed equity projects should be the ones where equity_agreed equals jobs_equity_allocated
  const completedEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.hasEquityData && 
      app.accepted_jobs && 
      app.accepted_jobs.equity_agreed > 0 && 
      app.accepted_jobs.equity_agreed === app.accepted_jobs.jobs_equity_allocated
    ), 
    [applicationsWithEquityData]
  );

  // Count notifications for tabs - applications in negotiation need action
  const pendingCount = negotiationApplications.length;
  const messagesCount = newMessagesCount || 0;

  useEffect(() => {
    if (pendingCount > 0 && activeTab !== "pending") {
      // Uncomment if you want to force switch to pending tab
      // setActiveTab("pending");
    }
  }, [pendingCount, activeTab]);

  // 🔧 FIX: Reduce debug logging frequency and add conditions
  useEffect(() => {
    if (!isLoadingEquityData) {
      console.log("=== APPLICATIONS DEBUG ===");
      console.log("Total applications:", applications.length);
      console.log("Applications with equity data:", applicationsWithEquityData.length);
      
      // Log status distribution
      const statusCounts = applicationsWithEquityData.reduce((acc, app) => {
        const status = app.status?.toLowerCase() || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log("Status distribution:", statusCounts);
      console.log("Pending count:", allPendingApplications.length);
      console.log("Current count:", currentApplications.length);
      console.log("Past count:", pastApplications.length);
      console.log("=== END DEBUG ===");
    }
  }, [
    applications.length, 
    applicationsWithEquityData.length, 
    allPendingApplications.length, 
    currentApplications.length, 
    pastApplications.length,
    isLoadingEquityData
  ]); // 🔧 FIX: Use primitive values instead of object references

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
            This tab shows applications that are awaiting a response, under review, or in negotiation.
          </AlertDescription>
        </Alert>
        {isLoadingEquityData ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <PendingApplicationsList 
            applications={allPendingApplications}
            onWithdraw={handleWithdrawApplication}
            onAccept={acceptJobAsJobSeeker}
            isWithdrawing={isWithdrawing}
          />
        )}
      </TabsContent>

      <TabsContent value="current">
        <Alert variant="default">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your active projects where you and the business have agreed to work together.
          </AlertDescription>
        </Alert>
        {isLoadingEquityData ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <ApplicationsList 
            applications={currentApplications}
            onApplicationUpdated={onApplicationUpdated}
          />
        )}
      </TabsContent>

      <TabsContent value="past">
        <Alert variant="default">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your past applications, including rejected and withdrawn projects.
          </AlertDescription>
        </Alert>
        {isLoadingEquityData ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <PastApplicationsList 
            applications={pastApplications}
            onApplicationUpdated={onApplicationUpdated}
          />
        )}
      </TabsContent>

      <TabsContent value="equity">
        <Alert variant="default">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your equity-based projects, both active and completed.
          </AlertDescription>
        </Alert>
        
        {isLoadingEquityData ? (
          <div className="text-center py-4">Loading equity data...</div>
        ) : (
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
        )}
      </TabsContent>
    </Tabs>
  );
};
