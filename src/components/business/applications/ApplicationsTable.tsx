
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
import { ChevronDown, ChevronRight, MessageSquare, Eye } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useJobApplications } from '@/contexts/JobApplicationContext';
import { Application } from '@/types/business';

interface ApplicationsTableProps {
  status: string;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ status }) => {
  const { applications, isLoading } = useJobApplications();
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  // Filter applications based on status
  const filteredApplications = applications.filter(app => {
    if (status === 'pending') {
      return app.status === 'pending' || app.status === 'in review';
    } else if (status === 'completed') {
      return app.status === 'completed';
    }
    return false;
  });

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
    return <div className="py-8 text-center">Loading applications...</div>;
  }

  if (filteredApplications.length === 0) {
    return (
      <div className="py-8 text-center">
        <p>No {status} applications found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredApplications.map(application => (
          <React.Fragment key={application.job_app_id}>
            <TableRow 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleApplicationExpanded(application.job_app_id)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{application.profile?.title || "No title"}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{application.business_roles?.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {application.business_roles?.project?.title && `Project: ${application.business_roles.project.title}`}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={status === 'completed' ? "secondary" : "default"}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(application.applied_at).toLocaleDateString()}
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
                      // Handle view application action
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
                <TableCell colSpan={5} className="p-0">
                  <Collapsible open={expandedApplications.has(application.job_app_id)}>
                    <CollapsibleContent className="p-4 border-t bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Application Details</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Message</p>
                              <p className="text-sm">{application.message || "No message provided"}</p>
                            </div>
                            {application.task_discourse && (
                              <div>
                                <p className="text-sm font-medium">Communication History</p>
                                <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
                                  <div className="space-y-2 text-xs">
                                    {application.task_discourse.split('\n\n').map((msg, i) => (
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
                        
                        <div>
                          <h4 className="font-medium mb-2">Skills Match</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Required Skills</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {application.business_roles?.skill_requirements?.map((skillReq, index) => {
                                  const hasSkill = application.profile?.skills?.some(
                                    s => typeof s === 'object' && s !== null && 'skill' in s && 
                                      typeof s.skill === 'string' && 
                                      typeof skillReq === 'object' && skillReq !== null && 'skill' in skillReq &&
                                      typeof skillReq.skill === 'string' &&
                                      s.skill.toLowerCase() === skillReq.skill.toLowerCase()
                                  );
                                  return (
                                    <Badge key={index} variant={hasSkill ? "default" : "outline"} className="text-xs">
                                      {typeof skillReq === 'object' ? skillReq.skill : skillReq} 
                                      {typeof skillReq === 'object' && skillReq.level && (
                                        <span>({skillReq.level})</span>
                                      )} 
                                      {hasSkill && "✓"}
                                    </Badge>
                                  );
                                })}
                                
                                {(!application.business_roles?.skill_requirements || application.business_roles.skill_requirements.length === 0) && 
                                  <p className="text-xs text-muted-foreground">No skill requirements specified</p>
                                }
                              </div>
                            </div>
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
