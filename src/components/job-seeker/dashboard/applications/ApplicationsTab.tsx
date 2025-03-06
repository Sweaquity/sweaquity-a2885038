
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { EquityProjectsList } from "./EquityProjectsList";
import { AllApplicationsList } from "./AllApplicationsList";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsTab = ({ applications, onApplicationUpdated = () => {} }: ApplicationsTabProps) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  
  // Safely normalize status to lowercase for case-insensitive comparison
  const normalizeStatus = (status: string | null | undefined): string => {
    return (status || "").toString().toLowerCase().trim();
  };
  
  // Filter applications by status - using the normalized status comparison
  const pendingApplications = applications.filter(app => {
    const status = normalizeStatus(app.status);
    return status === 'pending' || status === 'in review';
  });
  
  const equityProjects = applications.filter(app => {
    const status = normalizeStatus(app.status);
    return status === 'negotiation' || status === 'accepted';
  });
  
  useEffect(() => {
    // Count new messages from the past 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    let newMsgs = 0;
    
    applications.forEach(app => {
      if (app.task_discourse) {
        const lastMessageMatch = app.task_discourse.match(/\[([^\]]+)\]/);
        if (lastMessageMatch) {
          try {
            const msgDate = new Date(lastMessageMatch[1]);
            if (msgDate > oneDayAgo && ['negotiation', 'accepted'].includes(normalizeStatus(app.status))) {
              newMsgs++;
            }
          } catch (e) {
            console.error("Error parsing message date:", e);
          }
        }
      }
    });
    
    setNewMessagesCount(newMsgs);
    
    // Set up realtime listener for application updates
    const channel = supabase
      .channel('job-seeker-apps')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: 'task_discourse=neq.null'
        },
        () => {
          setNewMessagesCount(prev => prev + 1);
          onApplicationUpdated();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [applications, onApplicationUpdated]);
  
  // Reset notification counter when viewing the relevant tab
  const handleTabChange = (value: string) => {
    if (value === 'equity') {
      setNewMessagesCount(0);
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
        <p className="text-muted-foreground text-sm">View and manage your applications</p>
      </CardHeader>
      <CardContent className="overflow-container">
        <Tabs defaultValue="pending" className="space-y-4" onValueChange={handleTabChange}>
          <div className="overflow-x-hidden">
            <TabsList className="responsive-tabs h-auto p-1 w-full grid grid-cols-3 gap-1">
              <TabsTrigger value="pending" className="px-3 py-1.5">
                Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="equity" className="px-3 py-1.5 relative">
                Current Equity ({equityProjects.length})
                {newMessagesCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {newMessagesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="px-3 py-1.5">
                All ({applications.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingApplications.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No pending applications found.</p>
            ) : (
              <PendingApplicationsList 
                applications={pendingApplications} 
                onApplicationUpdated={onApplicationUpdated} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="equity" className="space-y-4 mt-4">
            {equityProjects.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No equity projects found.</p>
            ) : (
              <EquityProjectsList 
                applications={equityProjects} 
                onApplicationUpdated={onApplicationUpdated} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No applications found.</p>
            ) : (
              <AllApplicationsList 
                applications={applications} 
                onApplicationUpdated={onApplicationUpdated} 
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
