import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApplicationsTable } from "./ApplicationsTable";
import { ActiveProjectsTable } from "./ActiveProjectsTable";

export const ProjectApplicationsSection = () => {
  const [activeTab, setActiveTab] = useState("pending");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Project Applications</h2>
        <p className="text-muted-foreground">
          Applications received for your projects. Review applications, negotiate between parties, agree accepted terms.
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="py-4">
            <ApplicationsTable status="pending" />
          </TabsContent>
          
          <TabsContent value="active" className="py-4">
            <p className="text-muted-foreground mb-4">
              When both users (jobseeker and business) agree on the terms both are required to 'accept terms' which will then allow the user to work on the tasks and as the tasks are completed the equity allocation is reviewed in the Live Projects tab.
            </p>
            <ActiveProjectsTable status="active" />
          </TabsContent>
          
          <TabsContent value="completed" className="py-4">
            <ApplicationsTable status="completed" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
