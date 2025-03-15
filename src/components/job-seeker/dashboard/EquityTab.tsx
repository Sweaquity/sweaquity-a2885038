
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquityProject, JobApplication, Skill } from "@/types/jobSeeker";
import { ProjectCard } from "./opportunities/ProjectCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EquityTabProps {
  equityProjects: EquityProject[];
  logEffort: {
    projectId: string;
    hours: number;
    description: string;
  };
  onLogEffort?: () => void;
  onLogEffortChange?: (field: string, value: any) => void;
  userSkills?: Skill[];
}

export const EquityTab = ({ 
  equityProjects,
  logEffort,
  onLogEffort,
  onLogEffortChange,
  userSkills = []
}: EquityTabProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { syncAcceptedJobs, isLoading } = useAcceptedJobs();
  
  const handleSyncAcceptedJobs = async () => {
    await syncAcceptedJobs();
    toast.success("Synced accepted jobs. If any issues persist, please contact support.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Equity Projects</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSyncAcceptedJobs}
          disabled={isLoading}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          {isLoading ? "Syncing..." : "Fix Equity Issues"}
        </Button>
      </div>
      
      {equityProjects.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No Equity Projects Yet</h3>
              <p className="text-muted-foreground">
                You don't have any equity projects yet. Apply to projects in the Opportunities tab to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equityProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userSkills={userSkills || []}
              onSelectProject={() => setSelectedProjectId(project.id)}
              onSelectTask={() => {}}
            />
          ))}
        </div>
      )}
      
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            {equityProjects.find(p => p.id === selectedProjectId)?.title}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Equity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Total Equity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {equityProjects.reduce((total, project) => total + (project.equity_amount || 0), 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{equityProjects.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Hours Logged</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {equityProjects.reduce((total, project) => total + (project.total_hours_logged || 0), 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium mb-2">Time Log History</h3>
              {equityProjects.flatMap(project => 
                project.effort_logs?.map((log, index) => (
                  <div key={`${project.id}-${index}`} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{project.title || 'Unnamed Project'}</p>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{log.hours} hours</p>
                      <p className="text-sm text-muted-foreground">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) || []
              )}
              
              {equityProjects.flatMap(project => project.effort_logs || []).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No time logs recorded yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
