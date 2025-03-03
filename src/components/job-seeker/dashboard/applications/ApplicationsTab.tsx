
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsList } from "./ApplicationsList";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { EquityProjectsList } from "./EquityProjectsList";
import { PastApplicationsList } from "./PastApplicationsList";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsTab = ({ applications, onApplicationUpdated = () => {} }: ApplicationsTabProps) => {
  // Filter applications by status
  const pendingApplications = applications.filter(app => 
    ['pending', 'in review'].includes(app.status.toLowerCase())
  );
  
  const equityProjects = applications.filter(app => 
    ['negotiation', 'accepted'].includes(app.status.toLowerCase())
  );
  
  const pastApplications = applications.filter(app => 
    ['rejected', 'withdrawn'].includes(app.status.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
        <p className="text-muted-foreground text-sm">View and manage your applications</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid grid-cols-3 gap-2">
            <TabsTrigger value="pending">
              Pending Applications ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="equity">
              Current Equity Projects ({equityProjects.length})
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
              <p className="text-muted-foreground text-center p-4">No past applications found.</p>
            ) : (
              <PastApplicationsList 
                applications={pastApplications}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
