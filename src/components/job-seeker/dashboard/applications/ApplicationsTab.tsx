
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { useState } from "react";
import { ApplicationsList } from "./ApplicationsList";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsTab = ({ applications, onApplicationUpdated = () => {} }: ApplicationsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
        <p className="text-muted-foreground text-sm">View and manage your applications</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.length === 0 && (
            <p className="text-muted-foreground">No applications found.</p>
          )}
          
          <ApplicationsList 
            applications={applications} 
            onApplicationUpdated={onApplicationUpdated} 
          />
        </div>
      </CardContent>
    </Card>
  );
};
