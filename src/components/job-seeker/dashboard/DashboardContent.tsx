
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "../ProfileSection";
import { ApplicationsTab } from "./applications"; // Updated import path
import { OpportunitiesTab } from "./OpportunitiesTab";
import { EquityTab } from "./EquityTab";
import { useState } from "react";

interface DashboardContentProps {
  activeTab: string;
  dashboardData: any;
  refreshApplications: () => void;
}

export const DashboardContent = ({ 
  activeTab, 
  dashboardData,
  refreshApplications
}: DashboardContentProps) => {
  return (
    <div className="container mx-auto p-4 md:p-6 overflow-container dashboard-container">
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsContent value="profile" className="space-y-6">
          <ProfileSection 
            profile={dashboardData.profile} 
            cvUrl={dashboardData.cvUrl}
            parsedCvData={dashboardData.parsedCvData}
            setCvUrl={dashboardData.setCvUrl}
            setParsedCvData={dashboardData.setParsedCvData}
            skills={dashboardData.skills}
            onSkillsUpdate={dashboardData.handleSkillsUpdate}
            userCVs={dashboardData.userCVs}
            onCvListUpdated={dashboardData.onCvListUpdated}
          />
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-6">
          <ApplicationsTab 
            applications={dashboardData.applications}
            onApplicationUpdated={refreshApplications}
          />
        </TabsContent>
        
        <TabsContent value="opportunities" className="space-y-6">
          <OpportunitiesTab 
            projects={dashboardData.availableOpportunities}
            userSkills={dashboardData.skills || []}
          />
        </TabsContent>
        
        <TabsContent value="equity" className="space-y-6">
          <EquityTab 
            equityProjects={dashboardData.equityProjects}
            logEffort={dashboardData.logEffort}
            onLogEffort={dashboardData.onLogEffort}
            onLogEffortChange={dashboardData.onLogEffortChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
