
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, FileText } from "lucide-react";
import { SkillBadge } from "../SkillBadge";

interface TaskCardProps {
  project: EquityProject;
  task: SubTask;
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const TaskCard = ({ project, task, userSkillStrings, onApply }: TaskCardProps) => {
  // Ensure task has an id for the key
  const taskId = task.task_id || task.id || "";
  
  // Handle skill requirements safely
  const getSkillRequirements = () => {
    if (Array.isArray(task.skill_requirements)) {
      return task.skill_requirements;
    }
    if (Array.isArray(task.skills_required)) {
      return task.skills_required;
    }
    return [];
  };
  
  return (
    <div key={taskId} className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h3 className="font-semibold text-base">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="flex items-center">
              <BarChart3 className="h-3 w-3 mr-1" />
              {task.equity_allocation}% Equity
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {task.timeframe}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">{task.description}</p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Required Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {getSkillRequirements().map((req, idx) => {
              const skillName = typeof req === 'string' ? req : 
                        (req && typeof req === 'object' && ('skill' in req || 'name' in req)) ? 
                        (req.skill || req.name) : '';
                        
              if (!skillName) return null;
              
              const skillLower = String(skillName).toLowerCase();
              const isUserSkill = userSkillStrings.map(s => s.toLowerCase()).includes(skillLower);
              
              // Create a Skill object for the SkillBadge
              const skillObject: Skill = { 
                skill: skillName, 
                level: "Intermediate" 
              };
              
              return (
                <SkillBadge 
                  key={idx} 
                  skill={skillObject} 
                  isUserSkill={isUserSkill} 
                />
              );
            })}
          </div>
        </div>
        
        <Button 
          onClick={() => onApply(project, task)}
          className="w-full sm:w-auto mt-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          Apply for this role
        </Button>
      </div>
    </div>
  );
};
