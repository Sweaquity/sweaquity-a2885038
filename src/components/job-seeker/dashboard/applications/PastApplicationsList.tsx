
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { JobApplication } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const PastApplicationsList = ({ 
  applications,
  onApplicationUpdated
}: PastApplicationsListProps) => {
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

  const handleViewProject = (application: JobApplication) => {
    if (application.task_id) {
      navigate(`/seeker/dashboard/project/${application.task_id}`, { state: { application }});
    } else {
      toast.error("Project details not available");
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!applications.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">No past applications found</p>
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
                      {application.business_roles?.title || "Untitled Role"}
                      <Badge className={`ml-2 ${getStatusBadgeColor(application.status)}`} variant="secondary">
                        {application.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {application.business_roles?.company_name || 'Company'} | Project: {application.business_roles?.project_title || 'Project'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Applied: {getTimeAgo(application.applied_at)}
                      {application.updated_at && application.updated_at !== application.applied_at && (
                        <span className="ml-2">Updated: {getTimeAgo(application.updated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <div className="text-xs font-medium">Status</div>
                    <div className="text-sm capitalize">{application.status}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Application Date</div>
                    <div className="text-sm">{formatDate(application.applied_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">Last Updated</div>
                    <div className="text-sm">{formatDate(application.updated_at)}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex mt-4 md:mt-0 justify-between items-center space-x-2">
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
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Role Description</h4>
                    <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Application Details</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Application Date:</div>
                          <div className="text-sm">{formatDate(application.applied_at)}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Status:</div>
                          <div className="text-sm capitalize">{application.status}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Last Updated:</div>
                          <div className="text-sm">{formatDate(application.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {application.task_id && (
                      <div>
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewProject(application)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Project Details
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {application.message && (
                    <div>
                      <h4 className="font-medium mb-2">Your Application Message</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{application.message}</p>
                      </div>
                    </div>
                  )}
                  
                  {application.task_discourse && (
                    <div>
                      <h4 className="font-medium mb-2">Communication History</h4>
                      <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto whitespace-pre-line">
                        <p className="text-sm">{application.task_discourse}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
