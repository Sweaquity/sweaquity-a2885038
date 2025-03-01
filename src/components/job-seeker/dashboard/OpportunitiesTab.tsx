
import { useState } from "react";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ApplicationForm } from "@/components/projects/ApplicationForm";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({
  projects,
  userSkills,
}: OpportunitiesTabProps) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [applyingToProject, setApplyingToProject] = useState<{
    projectId: string;
    taskId: string;
    title?: string;
  } | null>(null);

  const toggleProject = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleApply = (projectId: string, taskId: string, title?: string) => {
    setApplyingToProject({ projectId, taskId, title });
  };

  const handleCancelApply = () => {
    setApplyingToProject(null);
  };

  const handleApplicationSubmitted = () => {
    setApplyingToProject(null);
  };

  if (applyingToProject) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Apply for Opportunity</h2>
        <ApplicationForm
          projectId={applyingToProject.projectId}
          taskId={applyingToProject.taskId}
          projectTitle={projects.find(p => p.id === applyingToProject.projectId)?.title}
          taskTitle={applyingToProject.title}
          onCancel={handleCancelApply}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-10 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium">No open opportunities available</h3>
        <p className="text-gray-500 mt-2">
          Check back later for new project opportunities
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Available Opportunities</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Timeframe</TableHead>
            <TableHead>Equity</TableHead>
            <TableHead>Skills Required</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const task = project.sub_tasks?.[0];
            if (!task) return null;
            
            const isExpanded = expandedProjectId === project.id;

            return (
              <>
                <TableRow key={project.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                  </TableCell>
                  <TableCell>{project.business_roles?.company_name || "Unknown Company"}</TableCell>
                  <TableCell>{task.timeframe}</TableCell>
                  <TableCell>{task.equity_allocation}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {task.skill_requirements?.slice(0, 3).map((skillReq, idx) => (
                        <Badge key={idx} variant="outline">
                          {skillReq.skill} ({skillReq.level})
                        </Badge>
                      ))}
                      {task.skill_requirements && task.skill_requirements.length > 3 && (
                        <Badge variant="outline">+{task.skill_requirements.length - 3} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProject(project.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(project.project_id, task.task_id, task.title);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${project.id}-expanded`}>
                    <TableCell colSpan={6} className="p-0 border-t-0">
                      <div className="bg-gray-50 p-4 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {project.business_roles?.company_name} • {project.business_roles?.project_title}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Description</h4>
                          <p className="text-sm">{task.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium mb-1">Equity Allocation</h4>
                            <p className="text-sm">{task.equity_allocation}%</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Timeframe</h4>
                            <p className="text-sm">{task.timeframe}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Required Skills</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.skill_requirements?.map((skillReq, idx) => (
                              <Badge key={idx} variant="outline">
                                {skillReq.skill} ({skillReq.level})
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button
                            onClick={() => handleApply(project.project_id, task.task_id, task.title)}
                          >
                            Apply for This Role
                          </Button>
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
