
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  id: string;
  label: string;
  notificationCount?: number;
}

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: TabItem[];
}

export const DashboardTabs = ({ 
  activeTab, 
  onTabChange, 
  tabs 
}: DashboardTabsProps) => {
  return (
    <TabsList className="grid grid-cols-4">
      {tabs.map((tab) => (
        <TabsTrigger 
          key={tab.id} 
          value={tab.id} 
          onClick={() => onTabChange(tab.id)}
          className="relative"
        >
          {tab.label}
          {tab.notificationCount !== undefined && tab.notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
              {tab.notificationCount}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
