
import { useState, useEffect } from "react";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";
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
import { ApplicationSkills } from "./applications/ApplicationSkills";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({
  projects,
  userSkills,
}: OpportunitiesTabProps) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Filter projects that match user skills
    if (userSkills.length > 0) {
      const userSkillNames = userSkills.map(skill => skill.skill.toLowerCase());
      
      const matched = projects.filter(project => {
        const task = project.sub_tasks?.[0];
        if (!task) return false;
        
        // Check if any required skills match user skills
        const requiredSkills = task.skill_requirements?.map(req => req.skill.toLowerCase()) || 
                              task.skills_required?.map(skill => skill.toLowerCase()) || [];
        
        return requiredSkills.some(skill => userSkillNames.includes(skill));
      });
      
      setFilteredProjects(matched);
    } else {
      // If no user skills, show all projects
      setFilteredProjects(projects);
    }
  }, [projects, userSkills]);

  const toggleProject = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleApply = (projectId: string, taskId: string) => {
    // Updated to use query parameters instead of state
    navigate(`/projects/${projectId}/apply?taskId=${taskId}`);
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center p-10 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium">No matching opportunities available</h3>
        <p className="text-gray-500 mt-2">
          We couldn't find any opportunities that match your skills. Please update your skills profile 
          or check back later for new project opportunities.
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
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => {
            const task = project.sub_tasks?.[0];
            if (!task) return null;
            
            const isExpanded = expandedProjectId === project.id;
            
            // Get user matched skills
            const userSkillNames = userSkills.map(skill => skill.skill.toLowerCase());
            const requiredSkillNames = task.skill_requirements?.map(req => req.skill.toLowerCase()) || 
                                     task.skills_required?.map(skill => skill.toLowerCase()) || [];
            const matchedSkills = requiredSkillNames.filter(skill => userSkillNames.includes(skill));

            return (
              <>
                <TableRow key={project.id} className={`cursor-pointer hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}>
                  <TableCell onClick={() => toggleProject(project.id)}>
                    <div className="font-medium">{task.title}</div>
                  </TableCell>
                  <TableCell onClick={() => toggleProject(project.id)}>
                    {project.business_roles?.company_name || "Unknown Company"}
                  </TableCell>
                  <TableCell onClick={() => toggleProject(project.id)}>{task.timeframe}</TableCell>
                  <TableCell onClick={() => toggleProject(project.id)}>{task.equity_allocation}%</TableCell>
                  <TableCell onClick={() => toggleProject(project.id)}>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      <ApplicationSkills 
                        requiredSkills={task.skill_requirements || task.skills_required || []}
                        matchedSkills={matchedSkills}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProject(project.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${project.id}-expanded`}>
                    <TableCell colSpan={6} className="p-0 border-t-0">
                      <div className="bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-sm text-gray-600">
                              {project.business_roles?.company_name} • {project.title}
                            </p>
                            {task.description && (
                              <p className="mt-2 text-sm text-gray-600">
                                {task.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col justify-center items-end">
                            <Button
                              onClick={() => handleApply(project.project_id, task.task_id)}
                              size="sm"
                            >
                              Apply for This Role
                            </Button>
                          </div>
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
                          <div>
                            <h4 className="font-medium mb-1">Skills Match</h4>
                            <p className="text-sm font-medium text-green-600">
                              {matchedSkills.length} of {requiredSkillNames.length} skills
                            </p>
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
