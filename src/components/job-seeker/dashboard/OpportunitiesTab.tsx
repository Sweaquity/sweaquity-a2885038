
import React, { useState } from "react";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApplicationSkills } from "./applications/ApplicationSkills";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// EmptyState component
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
    <p className="text-muted-foreground">{message}</p>
  </div>
);

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const navigate = useNavigate();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  
  // Function to calculate matched skills for a project
  const getMatchedSkills = (project: EquityProject) => {
    const subTaskSkills = project.sub_tasks?.flatMap(task => task.skills_required || []) || [];
    const userSkillNames = userSkills.map(skill => skill.skill.toLowerCase());
    
    return subTaskSkills.filter(skill => 
      userSkillNames.includes(skill.toLowerCase())
    );
  };
  
  const handleApply = (projectId: string) => {
    navigate(`/seeker/opportunities/${projectId}`);
  };
  
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };
  
  if (!projects || projects.length === 0) {
    return <EmptyState message="No available opportunities found." />;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Available Opportunities</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Company / Project</TableHead>
            <TableHead>Timeframe</TableHead>
            <TableHead>Equity</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map(project => {
            const task = project.sub_tasks?.[0];
            const matchedSkills = getMatchedSkills(project);
            const isExpanded = expandedProjectId === project.id;
            
            return (
              <React.Fragment key={project.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleProjectExpanded(project.id)}
                >
                  <TableCell className="font-medium">
                    {task?.title || project.business_roles?.title || 'Untitled Role'}
                  </TableCell>
                  <TableCell>
                    {project.business_roles?.company_name || 'Unknown Company'}
                    {project.business_roles?.project_title && <span className="text-muted-foreground"> • {project.business_roles.project_title}</span>}
                  </TableCell>
                  <TableCell>
                    {task?.timeframe || project.time_allocated || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    {task?.equity_allocation ? `${task.equity_allocation}%` : 
                     project.equity_amount ? `${project.equity_amount}%` : 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <ApplicationSkills
                      skillRequirements={task?.skill_requirements}
                      roleSkills={task?.skills_required}
                      matchedSkills={matchedSkills}
                      limit={3}
                      small={true}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {isExpanded ? <ChevronDown className="inline h-4 w-4" /> : <ChevronRight className="inline h-4 w-4" />}
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4 border-t bg-muted/20">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Description</h4>
                            <p className="text-sm">
                              {task?.description || project.business_roles?.description || 'No description provided.'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Required Skills</h4>
                            <ApplicationSkills
                              skillRequirements={task?.skill_requirements}
                              roleSkills={task?.skills_required}
                              matchedSkills={matchedSkills}
                              displayEmpty={true}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button onClick={() => handleApply(project.id)}>
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
