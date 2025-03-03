
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { PastApplicationsList } from "./PastApplicationsList";
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationsListProps {
  applications: JobApplication[];
  pastApplications?: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({ 
  applications = [], 
  pastApplications = [],
  onApplicationUpdated 
}: ApplicationsListProps) => {
  const [activeTab, setActiveTab] = useState<string>("current");
  
  // Get all applications that are not rejected or withdrawn
  const currentApplications = applications.filter(app => 
    !['rejected', 'withdrawn'].includes(app.status.toLowerCase())
  );
  
  // Check if we have existing past applications passed in, if not, filter from all applications
  const allPastApplications = pastApplications.length > 0 
    ? pastApplications 
    : applications.filter(app => 
        ['rejected', 'withdrawn'].includes(app.status.toLowerCase())
      );

  return (
    <Tabs 
      defaultValue="current" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Your Applications</h3>
        <TabsList>
          <TabsTrigger value="current">
            Current 
            <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-primary/10 rounded-full">
              {currentApplications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
            <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-primary/10 rounded-full">
              {allPastApplications.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="current" className="mt-2">
        <PendingApplicationsList 
          applications={currentApplications}
          onApplicationUpdated={onApplicationUpdated}
        />
      </TabsContent>
      
      <TabsContent value="past" className="mt-2">
        <PastApplicationsList applications={allPastApplications} />
      </TabsContent>
    </Tabs>
  );
};
