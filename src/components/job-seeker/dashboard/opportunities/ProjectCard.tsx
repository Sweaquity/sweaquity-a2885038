
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowUpRight, Briefcase } from "lucide-react";
import { EquityProject, SubTask } from "@/types/jobSeeker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProjectCardProps {
  project: EquityProject;
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const ProjectCard = ({
  project,
  userSkillStrings,
  onApply
}: ProjectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const task = project.sub_tasks?.[0] || {} as SubTask;
  
  const getSkillMatch = () => {
    if (!project.skill_match || project.skill_match === 0) return "No match";
    if (project.skill_match < 30) return "Low match";
    if (project.skill_match < 70) return "Medium match";
    return "High match";
  };
  
  const getMatchColor = () => {
    if (!project.skill_match || project.skill_match === 0) return "bg-slate-100 text-slate-800";
    if (project.skill_match < 30) return "bg-blue-100 text-blue-800";
    if (project.skill_match < 70) return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };
  
  const handleViewProject = () => {
    if (project.project_id) {
      navigate(`/projects/${project.project_id}`);
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex flex-1 flex-col space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-md font-semibold line-clamp-1">
                {task.title || "Untitled Task"}
              </h3>
              <Badge className={getMatchColor()}>
                {getSkillMatch()}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                {project.business_roles?.company_name || "Unknown company"}
              </span>
              <span className="inline-flex items-center">
                Project: {project.title || "Untitled Project"}
              </span>
              <span className="inline-flex items-center">
                Equity: {task.equity_allocation}%
              </span>
            </div>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CardContent className="px-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 text-sm">
            <div>
              <p className="text-muted-foreground">Task Status</p>
              <p>{task.task_status || "Open"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeframe</p>
              <p>{task.timeframe}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Equity Allocation</p>
              <p>{task.equity_allocation}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-2 text-sm">
            <div>
              <p className="text-muted-foreground">Skills Required</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.skill_requirements?.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant={userSkillStrings.includes((typeof skill === 'string' ? skill : skill.skill).toLowerCase()) ? 'default' : 'outline'} 
                    className={userSkillStrings.includes((typeof skill === 'string' ? skill : skill.skill).toLowerCase()) ? '' : 'bg-slate-50'}
                  >
                    {typeof skill === 'string' ? skill : skill.skill}
                    {typeof skill !== 'string' && skill.level && 
                      <span className="ml-1 opacity-70">({skill.level})</span>
                    }
                  </Badge>
                ))}
                {(!task.skill_requirements || task.skill_requirements.length === 0) && 
                  <span className="text-muted-foreground">No specific skills required</span>
                }
              </div>
            </div>
          </div>
          
          <CollapsibleContent className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium mb-1">Task Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.description || "No description provided."}
              </p>
            </div>
            
            {project.business_roles?.description && (
              <div>
                <h4 className="font-medium mb-1">Project Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {project.business_roles.description}
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onApply(project, task)}
              >
                <Briefcase className="mr-1.5 h-4 w-4" />
                Apply for this role
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewProject}
              >
                <ArrowUpRight className="mr-1.5 h-4 w-4" />
                View Project
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
