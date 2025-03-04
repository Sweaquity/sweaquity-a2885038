
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ApplicationsList } from "./ApplicationsList";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { EquityProjectsList } from "./EquityProjectsList";
import { PastApplicationsList } from "./PastApplicationsList";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsTab = ({ applications, onApplicationUpdated = () => {} }: ApplicationsTabProps) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  
  // Debug the incoming applications (single log is sufficient)
  console.log("All applications in ApplicationsTab:", applications);
  
  // Filter applications by status
  const pendingApplications = applications.filter(app => 
    ['pending', 'in review'].includes(app.status.toLowerCase())
  );
  
  const equityProjects = applications.filter(app => 
    ['negotiation', 'accepted'].includes(app.status.toLowerCase())
  );
  
  // Make sure to filter by exact status values
  const pastApplications = applications.filter(app => 
    ['rejected', 'withdrawn'].includes(app.status.toLowerCase())
  );
  
  // Single console log for debugging filtered applications
  console.log("Filtered applications - Pending:", pendingApplications.length, 
              "Equity:", equityProjects.length, 
              "Past:", pastApplications.length, 
              "Past statuses:", pastApplications.map(app => app.status));
  
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
            if (msgDate > oneDayAgo && ['negotiation', 'accepted'].includes(app.status.toLowerCase())) {
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
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
        <p className="text-muted-foreground text-sm">View and manage your applications</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="space-y-4" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 gap-2">
            <TabsTrigger value="pending">
              Pending Applications ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="equity" className="relative">
              Current Equity Projects ({equityProjects.length})
              {newMessagesCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {newMessagesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Applications ({pastApplications.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No pending applications found.</p>
            ) : (
              <PendingApplicationsList 
                applications={pendingApplications} 
                onApplicationUpdated={onApplicationUpdated} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="equity" className="space-y-4">
            {equityProjects.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No equity projects found.</p>
            ) : (
              <EquityProjectsList 
                applications={equityProjects} 
                onApplicationUpdated={onApplicationUpdated} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastApplications.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No rejected or withdrawn applications found.</p>
            ) : (
              <PastApplicationsList 
                applications={pastApplications}
                onApplicationUpdated={onApplicationUpdated}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
