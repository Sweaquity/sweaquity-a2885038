
import { ReactNode } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  return (
    <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <TabsTrigger 
        value="dashboard" 
        onClick={() => onTabChange("dashboard")}
      >
        Dashboard
      </TabsTrigger>
      <TabsTrigger 
        value="profile" 
        onClick={() => onTabChange("profile")}
      >
        Profile
      </TabsTrigger>
      <TabsTrigger 
        value="applications" 
        onClick={() => onTabChange("applications")}
      >
        Applications
      </TabsTrigger>
      <TabsTrigger 
        value="opportunities" 
        onClick={() => onTabChange("opportunities")}
      >
        Opportunities
      </TabsTrigger>
    </TabsList>
  );
};
