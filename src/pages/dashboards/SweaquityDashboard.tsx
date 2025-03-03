import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "@/components/ui/charts";
import {
  Users,
  Briefcase,
  Building,
  FileText,
  ClipboardList,
  Activity
} from "lucide-react";

const SweaquityDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sweaquity Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <BarChart />
            </TabsContent>
            <TabsContent value="projects">
              <LineChart />
            </TabsContent>
            <TabsContent value="applications">
              <ClipboardList />
            </TabsContent>
            <TabsContent value="opportunities">
              <PieChart />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SweaquityDashboard;
