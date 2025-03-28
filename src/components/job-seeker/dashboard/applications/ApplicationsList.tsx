
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Eye, MessageSquare, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";
import { ProjectActions } from "./components/ProjectActions";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsList = ({ 
  applications,
  onApplicationUpdated
}: ApplicationsListProps) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const formatTimeframe = (timeframe: string | undefined) => {
    if (!timeframe) return "Not specified";
    return timeframe;
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  const handleSendMessage = () => {
    toast.info("The messaging feature is coming soon");
  };

  if (!applications.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">No current applications found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {applications.map(application => (
        <Card key={application.job_app_id} className="mb-4 overflow-hidden">
          <div className="border-b cursor-pointer" onClick={() => toggleExpand(application.job_app_id || '')}>
            <div className="flex flex-col md:flex-row justify-between p-4">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg flex items-center font-medium">
                      {application.business_roles?.title}
                      <Badge className="ml-2 bg-green-500" variant="secondary">
                        accepted
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {application.business_roles?.company_name} | Project: {application.business_roles?.project_title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Applied: {getTimeAgo(application.applied_at)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <div className="text-xs font-medium">Task Status</div>
                    <div className="text-sm">{application.business_roles?.task_status || "pending"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Timeframe</div>
                    <div className="text-sm">{formatTimeframe(application.business_roles?.timeframe)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Project Status</div>
                    <div className="text-sm">{application.business_roles?.project_status || "active"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Completion</div>
                    <div className="text-sm">{application.business_roles?.completion_percentage || 0}%</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs font-medium">Skills Required</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(application.business_roles?.skill_requirements) ? 
                      application.business_roles?.skill_requirements.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                        const level = typeof skill === 'string' ? 'Intermediate' : (skill.level || '');
                        
                        return (
                          <Badge variant="outline" key={index} className="text-xs">
                            {skillName} {level && <span className="ml-1 opacity-70">({level})</span>}
                          </Badge>
                        );
                      }) : 
                      <span className="text-muted-foreground text-xs">No skills specified</span>
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex mt-4 md:mt-0 justify-between items-center space-x-2">
                <Button 
                  variant="default" 
                  size="sm"
                >
                  {application.status}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(application.job_app_id || '');
                  }}
                >
                  {expandedItems.has(application.job_app_id || '') ? "Collapse" : "Expand"}
                </Button>
              </div>
            </div>
          </div>
          
          {expandedItems.has(application.job_app_id || '') && (
            <div>
              <Tabs defaultValue="details">
                <TabsList className="w-full border-b rounded-none">
                  <TabsTrigger value="details" className="flex-1">Project Details</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Project Description</h4>
                      <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Task Information</h4>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2">
                            <div className="text-sm font-medium">Status:</div>
                            <div className="text-sm">{application.business_roles?.task_status || "pending"}</div>
                          </div>
                          <div className="grid grid-cols-2">
                            <div className="text-sm font-medium">Timeframe:</div>
                            <div className="text-sm">{formatTimeframe(application.business_roles?.timeframe)}</div>
                          </div>
                          <div className="grid grid-cols-2">
                            <div className="text-sm font-medium">Completion:</div>
                            <div className="text-sm">{application.business_roles?.completion_percentage || 0}%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Actions</h4>
                        <ProjectActions 
                          application={application} 
                          onSendMessage={handleSendMessage}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Application Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex">
                          <div className="flex-none w-32 text-sm font-medium">Applied:</div>
                          <div className="text-sm">{formatDate(application.applied_at)}</div>
                        </div>
                        {application.accepted_jobs?.date_accepted && (
                          <div className="flex">
                            <div className="flex-none w-32 text-sm font-medium">Accepted:</div>
                            <div className="text-sm">{formatDate(application.accepted_jobs.date_accepted)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {application.task_discourse && (
                      <div>
                        <h4 className="font-medium mb-2">Communication</h4>
                        <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto whitespace-pre-line">
                          <p className="text-sm">{application.task_discourse}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
