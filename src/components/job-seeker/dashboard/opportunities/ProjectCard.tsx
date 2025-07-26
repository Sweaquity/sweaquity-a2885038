import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EquityProject, SubTask } from "@/types/jobSeeker";
import { Building, Clock, CreditCard, Eye, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProjectCardProps {
  project: EquityProject;
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const ProjectCard = ({ project, userSkillStrings, onApply }: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleViewProject = () => {
    if (project.project_id) {
      navigate(`/projects/${project.project_id}`);
    } else if (project.id) {
      navigate(`/projects/${project.id}`);
    } else {
      toast.error("Project details not available");
    }
  };
  
  const formatTimeframe = (timeframe: string | undefined) => {
    if (!timeframe) return "Flexible";
    return timeframe;
  };

  const getSkillMatch = (task: SubTask) => {
    if (!task.skill_requirements || !Array.isArray(task.skill_requirements) || task.skill_requirements.length === 0 || !userSkillStrings || userSkillStrings.length === 0) {
      return { count: 0, total: 0, percentage: 0 };
    }
    
    const taskSkills = task.skill_requirements.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (typeof skill === 'object' && skill !== null && 'skill' in skill && typeof skill.skill === 'string') {
        return skill.skill.toLowerCase();
      }
      return '';
    }).filter(Boolean);
    
    if (taskSkills.length === 0) {
      return { count: 0, total: 0, percentage: 0 };
    }
    
    const matchCount = userSkillStrings.filter(skill => 
      taskSkills.includes(skill.toLowerCase())
    ).length;
    
    return {
      count: matchCount,
      total: taskSkills.length,
      percentage: Math.round((matchCount / taskSkills.length) * 100)
    };
  };

  const formatSkills = (skills: any) => {
    if (!skills) return [];
    
    if (typeof skills === 'string') {
      return [skills];
    }
    
    if (Array.isArray(skills)) {
      return skills.map(skill => {
        if (typeof skill === 'string') {
          return skill;
        } else if (skill && (skill.name || skill.skill)) {
          return skill.name || skill.skill;
        }
        return '';
      }).filter(Boolean);
    }
    
    return [];
  };

  // Get project skills - handle both skills_required and any other property that might contain skills
  const projectSkills = formatSkills(project.skills_required || []);
  
  const matchedSkills = projectSkills.filter(skill => 
    userSkillStrings.some(userSkill => 
      (typeof userSkill === 'string' ? userSkill.toLowerCase() : 
       (userSkill.name || userSkill.skill || '').toLowerCase())
       .includes(skill.toLowerCase())
    )
  );

  const tasks = project.sub_tasks || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{project.title || "Untitled Project"}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <Building className="mr-1 h-4 w-4" />
              {project.business_roles?.company_name || "Unknown Company"}
            </div>
          </div>
          <div className="flex gap-2">
            {tasks.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleExpand}>
                {isExpanded ? "Show Less" : "Show Roles"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleViewProject}>
              <Eye className="h-4 w-4 mr-1" />
              View Project
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.business_roles?.description || "No description provided."}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          <div>
            <div className="text-xs font-medium">Equity Available</div>
            <div className="flex items-center">
              <CreditCard className="mr-1 h-3 w-3 text-muted-foreground" />
              <span>{project.equity_amount || 0}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium">Timeframe</div>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
              <span>{formatTimeframe(project.time_allocated)}</span>
            </div>
          </div>
          {project.skill_match !== undefined && (
            <div>
              <div className="text-xs font-medium">Skill Match</div>
              <div className="flex items-center">
                <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                <span>{project.skill_match}%</span>
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && tasks.length > 0 && (
          <div className="space-y-3 mt-3">
            <div className="text-sm font-medium">Available Roles</div>
            {tasks.map((task) => {
              const skillMatch = getSkillMatch(task);
              
              return (
                <div key={task.id} className="p-2 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {task.description || "No description provided."}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onApply(project, task)}
                    >
                      Apply
                    </Button>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs font-medium">Skill Match</div>
                    <div className="text-sm">{skillMatch.percentage}% ({skillMatch.count}/{skillMatch.total})</div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium mb-1">Required Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(task.skill_requirements) && task.skill_requirements.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : 
                                         (typeof skill === 'object' && skill !== null && 'skill' in skill) ? 
                                         skill.skill : '';
                        const skillLevel = typeof skill === 'string' ? 'Intermediate' : 
                                         (typeof skill === 'object' && skill !== null && 'level' in skill) ? 
                                         skill.level : '';
                        
                        const isMatched = userSkillStrings.includes(
                          typeof skillName === 'string' ? skillName.toLowerCase() : ''
                        );
                        
                        return (
                          <Badge 
                            key={index} 
                            variant={isMatched ? "default" : "outline"}
                            className={`text-xs ${isMatched ? "bg-green-500" : ""}`}
                          >
                            {skillName} {skillLevel ? `(${skillLevel})` : ''}
                          </Badge>
                        );
                      })}
                      {(!Array.isArray(task.skill_requirements) || task.skill_requirements.length === 0) && (
                        <span className="text-xs text-muted-foreground">No specific skills required</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
