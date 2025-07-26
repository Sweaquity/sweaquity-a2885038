import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  
  // 🔧 FIX: Use a more stable approach for equity data
  const [equityDataMap, setEquityDataMap] = useState<Record<string, any>>({});
  const [isLoadingEquityData, setIsLoadingEquityData] = useState(false);
  const lastFetchedAppsRef = useRef<string>('');
  const equityDataTimeoutRef = useRef<NodeJS.Timeout>();

  // 🔧 FIX: Create a stable hash of applications to prevent unnecessary fetches
  const applicationsHash = useMemo(() => {
    return applications
      .map(app => `${app.job_app_id}-${app.status}-${app.accepted_business}-${app.accepted_jobseeker}`)
      .sort() // Sort to ensure consistent ordering
      .join('|');
  }, [applications]);

  // 🔧 FIX: Debounced equity data fetching
  const fetchEquityData = useCallback(async (apps: JobApplication[]) => {
    if (apps.length === 0) {
      setEquityDataMap({});
      setIsLoadingEquityData(false);
      return;
    }
    
    // Clear any existing timeout
    if (equityDataTimeoutRef.current) {
      clearTimeout(equityDataTimeoutRef.current);
    }
    
    // Debounce the API call
    equityDataTimeoutRef.current = setTimeout(async () => {
      const jobAppIds = apps
        .map(app => app.job_app_id)
        .filter(id => id);
      
      if (jobAppIds.length === 0) {
        setEquityDataMap({});
        setIsLoadingEquityData(false);
        return;
      }
      
      try {
        setIsLoadingEquityData(true);
        
        const { data, error } = await supabase
          .from('accepted_jobs')
          .select('job_app_id, equity_agreed, jobs_equity_allocated, date_accepted, id')
          .in('job_app_id', jobAppIds);
          
        if (error) {
          console.error("Error fetching equity data:", error);
          return;
        }
        
        // Create equity data map
        const newEquityDataMap = (data || []).reduce((map, item) => {
          map[item.job_app_id] = {
            equity_agreed: item.equity_agreed || 0,
            jobs_equity_allocated: item.jobs_equity_allocated || 0,
            date_accepted: item.date_accepted,
            id: item.id
          };
          return map;
        }, {} as Record<string, any>);
        
        // Only update if the data actually changed
        setEquityDataMap(prev => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(newEquityDataMap);
          return hasChanged ? newEquityDataMap : prev;
        });
        
      } catch (err) {
        console.error("Error processing equity data:", err);
      } finally {
        setIsLoadingEquityData(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // 🔧 FIX: Only fetch when applications hash actually changes
  useEffect(() => {
    if (applicationsHash !== lastFetchedAppsRef.current) {
      lastFetchedAppsRef.current = applicationsHash;
      fetchEquityData(applications);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (equityDataTimeoutRef.current) {
        clearTimeout(equityDataTimeoutRef.current);
      }
    };
  }, [applicationsHash, fetchEquityData, applications]);

  // 🔧 FIX: Stable applications with equity data using useMemo
  const applicationsWithEquityData = useMemo(() => {
    return applications.map(app => ({
      ...app,
      hasEquityData: !!equityDataMap[app.job_app_id],
      accepted_jobs: equityDataMap[app.job_app_id] || null
    }));
  }, [applications, equityDataMap]);

  // Helper function to filter applications by status
  const getApplicationsByStatus = useCallback((statusArray: string[]) => {
    return applicationsWithEquityData.filter(app => {
      const status = app.status?.toLowerCase() || '';
      return statusArray.map(s => s.toLowerCase()).includes(status);
    });
  }, [applicationsWithEquityData]);

  // 🔧 FIX: Stable filtered arrays with proper dependencies
  const pendingApplications = useMemo(() => {
    return getApplicationsByStatus(['pending', 'in review']);
  }, [getApplicationsByStatus]);

  const negotiationApplications = useMemo(() => {
    return getApplicationsByStatus(['negotiation']);
  }, [getApplicationsByStatus]);

  const currentApplications = useMemo(() => {
    const acceptedApps = getApplicationsByStatus(['accepted']);
    
    return acceptedApps.filter(app => {
      if (!app.accepted_jobs) return true;
      
      const equityAgreed = app.accepted_jobs.equity_agreed || 0;
      const equityAllocated = app.accepted_jobs.jobs_equity_allocated || 0;
      
      return equityAgreed === 0 || equityAgreed > equityAllocated;
    });
  }, [getApplicationsByStatus]);

  const pastApplications = useMemo(() => {
    return [
      ...getApplicationsByStatus(['withdrawn']),
      ...getApplicationsByStatus(['rejected'])
    ];
  }, [getApplicationsByStatus]);

  const allPendingApplications = useMemo(() => {
    return [...pendingApplications, ...negotiationApplications];
  }, [pendingApplications, negotiationApplications]);

  const activeEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.hasEquityData && 
      app.status?.toLowerCase() === 'accepted' && 
      app.accepted_jobs && 
      app.accepted_jobs.equity_agreed > app.accepted_jobs.jobs_equity_allocated
    ), 
    [applicationsWithEquityData]
  );

  const completedEquityProjects = useMemo(() => 
    applicationsWithEquityData.filter(app => 
      app.hasEquityData && 
      app.accepted_jobs && 
      app.accepted_jobs.equity_agreed > 0 && 
      app.accepted_jobs.equity_agreed === app.accepted_jobs.jobs_equity_allocated
    ), 
    [applicationsWithEquityData]
  );

  // Count notifications for tabs
  const pendingCount = negotiationApplications.length;
  const messagesCount = newMessagesCount || 0;

  // 🔧 FIX: Reduce debug logging and make it conditional
  const lastDebugRef = useRef<string>('');
  useEffect(() => {
    // Only log when not loading and when counts actually change
    if (!isLoadingEquityData && applications.length > 0) {
      const debugInfo = {
        total: applications.length,
        withEquity: applicationsWithEquityData.length,
        pending: allPendingApplications.length,
        current: currentApplications.length,
        past: pastApplications.length
      };
      
      // Create a stable string to compare
      const debugString = JSON.stringify(debugInfo);
      
      // Only log if this is different from the last log
      if (lastDebugRef.current !== debugString) {
        console.log("📊 Applications Summary:", debugInfo);
        lastDebugRef.current = debugString;
      }
    }
  }, [
    applications.length,
    applicationsWithEquityData.length,
    allPendingApplications.length,
    currentApplications.length,
    pastApplications.length,
    isLoadingEquityData
  ]);

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
        <PendingApplicationsList 
          applications={allPendingApplications}
          onWithdraw={handleWithdrawApplication}
          onAccept={acceptJobAsJobSeeker}
          isWithdrawing={isWithdrawing}
        />
      </TabsContent>

      <TabsContent value="current">
        <Alert variant="default">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            This tab shows your active projects where you and the business have agreed to work together.
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
