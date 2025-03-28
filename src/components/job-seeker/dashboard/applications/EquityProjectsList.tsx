
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectActions } from "./components/ProjectActions";
import { JobApplication } from "@/types/jobSeeker";
import { formatDistanceToNow } from "date-fns";

interface EquityProjectsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  isCompleted: boolean;
}

export const EquityProjectsList = ({ 
  applications, 
  onApplicationUpdated,
  isCompleted
}: EquityProjectsListProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    // Further filter applications based on completion status
    setFilteredApplications(applications.filter(app => {
      if (!app.accepted_jobs) return false;
      
      const isFullyEarned = 
        app.accepted_jobs.equity_agreed > 0 && 
        app.accepted_jobs.equity_agreed === app.accepted_jobs.jobs_equity_allocated;
        
      // For completed list, only show fully earned equity
      if (isCompleted) {
        return isFullyEarned;
      }
      
      // For active list, show projects still earning equity
      return !isFullyEarned;
    }));
  }, [applications, isCompleted]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (filteredApplications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {isCompleted 
                ? "No completed equity projects found" 
                : "No active equity projects found"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredApplications.map(application => {
        const equityProgress = application.accepted_jobs 
          ? Math.round((application.accepted_jobs.jobs_equity_allocated / application.accepted_jobs.equity_agreed) * 100) 
          : 0;

        return (
          <Card key={application.job_app_id || application.id} className="overflow-hidden">
            <div 
              className="p-4 border-b cursor-pointer" 
              onClick={() => toggleExpand(application.job_app_id || "")}
            >
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-lg font-medium">
                        {application.business_roles?.title || "Untitled Task"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {application.business_roles?.company_name || "Company"} | Project: {application.business_roles?.project_title || "Project"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Applied: {formatDistanceToNow(new Date(application.applied_at || Date.now()), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <Badge variant={isCompleted ? "outline" : "secondary"}>
                      {isCompleted ? "Completed" : "Active"}
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Equity Earned: {application.accepted_jobs?.jobs_equity_allocated || 0}%</span>
                      <span>Total Equity: {application.accepted_jobs?.equity_agreed || 0}%</span>
                    </div>
                    <Progress value={equityProgress} className="h-2" />
                  </div>
                </div>
                
                <div className="flex items-center mt-4 md:mt-0 space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(application.job_app_id || "");
                    }}
                  >
                    {expandedItems.has(application.job_app_id || "") ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </div>
            
            {expandedItems.has(application.job_app_id || "") && (
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Project Description</h4>
                  <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Equity Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Agreed Equity:</div>
                      <div className="text-sm">{application.accepted_jobs?.equity_agreed || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Earned So Far:</div>
                      <div className="text-sm">{application.accepted_jobs?.jobs_equity_allocated || 0}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <ProjectActions application={application} />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
