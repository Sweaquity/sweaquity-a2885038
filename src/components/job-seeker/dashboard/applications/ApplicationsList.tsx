
import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ApplicationItem } from "./ApplicationItem";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PendingApplicationsList } from "./PendingApplicationsList";
import { PastApplicationsList } from "./PastApplicationsList";

interface ApplicationsListProps {
  applications: JobApplication[];
  pastApplications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsList = ({ applications, pastApplications, onApplicationUpdated }: ApplicationsListProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const { getMatchedSkills } = useUserSkills();
  
  const handleApplicationUpdate = () => {
    onApplicationUpdated();
  };

  return (
    <Tabs 
      defaultValue="pending" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">Current Applications</TabsTrigger>
        <TabsTrigger value="past">Past Applications</TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="mt-6">
        <PendingApplicationsList 
          applications={applications} 
          onApplicationUpdated={handleApplicationUpdate} 
        />
      </TabsContent>
      
      <TabsContent value="past" className="mt-6">
        <PastApplicationsList 
          applications={pastApplications} 
          onApplicationUpdated={handleApplicationUpdate} 
        />
      </TabsContent>
    </Tabs>
  );
};
