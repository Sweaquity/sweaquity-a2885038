
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { 
  Card, 
  CardHeader, 
  CardContent 
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface PastApplicationsListProps {
  applications: JobApplication[];
}

export const PastApplicationsList = ({ 
  applications = []
}: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();
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

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Check project title
    if (application.business_roles?.project_title && 
        String(application.business_roles.project_title).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check company name
    if (application.business_roles?.company_name && 
        String(application.business_roles.company_name).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check role title
    if (application.business_roles?.title && 
        String(application.business_roles.title).toLowerCase().includes(term)) {
      return true;
    }
    
    return false;
  });

  if (applications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No past applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search past applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Company/Project</TableHead>
            <TableHead className="w-[180px]">Role</TableHead>
            <TableHead className="w-[100px]">Applied</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications.map((application) => {
            const isExpanded = expandedItems.has(application.job_app_id);
            const appliedDate = new Date(application.applied_at);
            const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true });
            
            return (
              <>
                <TableRow 
                  key={application.job_app_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(application.job_app_id)}
                >
                  <TableCell>
                    <div className="font-medium">{application.business_roles?.company_name || "Unknown Company"}</div>
                    <div className="text-xs text-muted-foreground">{application.business_roles?.project_title || "Unknown Project"}</div>
                  </TableCell>
                  <TableCell>
                    {application.business_roles?.title || "Unknown Role"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{timeAgo}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={application.status.toLowerCase() === 'rejected' ? 'destructive' : 'outline'}>
                      {application.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <div className="bg-muted/30 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Role Details</h4>
                            <p className="text-sm mb-2">{application.business_roles?.description || "No description available"}</p>
                            
                            <h4 className="text-sm font-medium mt-4 mb-2">Required Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {application.business_roles?.skill_requirements?.map((skill, index) => {
                                const skillName = typeof skill === 'string' ? skill : skill.skill;
                                const skillLevel = typeof skill !== 'string' && skill.level ? ` (${skill.level})` : '';
                                
                                return (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skillName}{skillLevel}
                                  </Badge>
                                );
                              })}
                              {(!application.business_roles?.skill_requirements || 
                                application.business_roles.skill_requirements.length === 0) && 
                                <span className="text-xs text-muted-foreground">No skills specified</span>
                              }
                            </div>
                          </div>
                          
                          <div>
                            {application.task_discourse && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">
                                  {application.status === 'rejected' ? 'Rejection Feedback' : 'Withdrawal Details'}
                                </h4>
                                <div className="bg-slate-50 p-3 rounded-md border text-sm whitespace-pre-wrap">
                                  {application.task_discourse}
                                </div>
                              </div>
                            )}
                            
                            {!application.task_discourse && (
                              <div className="text-sm text-muted-foreground italic">
                                No additional feedback provided.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
