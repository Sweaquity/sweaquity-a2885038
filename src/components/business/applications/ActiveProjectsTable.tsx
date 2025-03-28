
import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MessageSquare, Eye, CheckCircle } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useJobApplications } from '@/contexts/JobApplicationContext';
import { Application } from '@/types/business';
import { Progress } from '@/components/ui/progress';

interface ActiveProjectsTableProps {
  status: string;
}

export const ActiveProjectsTable: React.FC<ActiveProjectsTableProps> = ({ status }) => {
  const { applications, isLoading } = useJobApplications();
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  // Filter applications based on being active (both parties have accepted)
  const activeApplications = applications.filter(app => 
    app.accepted_business && app.accepted_jobseeker
  );

  const toggleApplicationExpanded = (id: string) => {
    setExpandedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading active projects...</div>;
  }

  if (activeApplications.length === 0) {
    return (
      <div className="py-8 text-center">
        <p>No active projects found. Projects become active when both the business and job seeker accept the terms.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Team Member</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Equity</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeApplications.map(application => (
          <React.Fragment key={application.job_app_id}>
            <TableRow 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleApplicationExpanded(application.job_app_id)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{application.business_roles?.project?.title || "Unnamed Project"}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{application.business_roles?.title || "Untitled Task"}</p>
                  <Badge className="mt-1" variant="outline">
                    {application.business_roles?.timeframe || "No timeframe"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{application.profile?.title || "No title"}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{application.completion_percentage || 0}%</span>
                  </div>
                  <Progress value={application.completion_percentage || 0} />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Allocated:</span> {application.business_roles?.equity_allocation || 0}%
                  </div>
                  <div>
                    <span className="font-medium">Earned:</span> {application.equity_earned || 0}%
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle message action
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle view project action
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleApplicationExpanded(application.job_app_id);
                    }}
                  >
                    {expandedApplications.has(application.job_app_id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            
            {expandedApplications.has(application.job_app_id) && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <Collapsible open={expandedApplications.has(application.job_app_id)}>
                    <CollapsibleContent className="p-4 border-t bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Task Details</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Description</p>
                              <p className="text-sm">{application.business_roles?.description || "No description provided"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Start Date</p>
                              <p className="text-sm">{application.accepted_date ? new Date(application.accepted_date).toLocaleDateString() : "Not started"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Required Skills</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {application.business_roles?.skill_requirements?.map((skillReq, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {typeof skillReq === 'object' ? skillReq.skill : skillReq} 
                                    {typeof skillReq === 'object' && skillReq.level && (
                                      <span>({skillReq.level})</span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Time & Equity Tracking</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Hours Logged</p>
                              <p className="text-sm">{application.hours_logged || 0} hours</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Equity Allocation</p>
                              <p className="text-sm">{application.business_roles?.equity_allocation || 0}%</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Equity Earned</p>
                              <p className="text-sm">{application.equity_earned || 0}% ({((application.equity_earned || 0) / (application.business_roles?.equity_allocation || 1) * 100).toFixed(0)}% of allocated)</p>
                            </div>
                            
                            {application.task_discourse && (
                              <div>
                                <p className="text-sm font-medium">Recent Messages</p>
                                <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
                                  <div className="space-y-2 text-xs">
                                    {application.task_discourse.split('\n\n').slice(-3).map((msg, i) => (
                                      <div key={i} className="p-2 rounded-md bg-gray-100 border-gray-200 border">
                                        {msg}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
