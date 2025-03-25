
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export interface ApplicationsTabBaseProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  newMessagesCount: number;
}

export const ApplicationsTabBase = ({ 
  applications, 
  onApplicationUpdated,
  newMessagesCount = 0
}: ApplicationsTabBaseProps) => {
  const [activeTab, setActiveTab] = useState("active");
  
  // Filter applications by status
  const activeApplications = applications.filter(
    (app) => app.status !== "rejected" && app.status !== "withdrawn"
  );
  const archivedApplications = applications.filter(
    (app) => app.status === "rejected" || app.status === "withdrawn"
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Applications</h2>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="relative">
            Active Applications
            {newMessagesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                {newMessagesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">Archived Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You have no active applications.
            </div>
          ) : (
            <div className="space-y-4">
              {activeApplications.map((application) => (
                <ApplicationItem
                  key={application.job_app_id || application.id}
                  application={application}
                  onApplicationUpdated={onApplicationUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived">
          {archivedApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You have no archived applications.
            </div>
          ) : (
            <div className="space-y-4">
              {archivedApplications.map((application) => (
                <ApplicationItem
                  key={application.job_app_id || application.id}
                  application={application}
                  onApplicationUpdated={onApplicationUpdated}
                  compact={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
