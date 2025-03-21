
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab {
  id: string;
  label: string;
}

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs?: Tab[];
}

export function DashboardTabs({ activeTab, onTabChange, tabs }: DashboardTabsProps) {
  const defaultTabs: Tab[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "profile", label: "Profile" },
    { id: "applications", label: "Applications" },
    { id: "opportunities", label: "Opportunities" },
  ];

  const tabsToRender = tabs || defaultTabs;

  return (
    <TabsList className="w-full max-w-3xl grid grid-cols-4 p-0 h-auto">
      {tabsToRender.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className={`rounded-none py-3 ${
            activeTab === tab.id
              ? "border-b-2 border-primary"
              : ""
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
