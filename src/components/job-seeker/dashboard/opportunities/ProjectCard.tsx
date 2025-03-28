import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EquityProject, SubTask } from '@/types/jobSeeker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TaskCard } from './TaskCard';

interface ProjectCardProps {
  project: EquityProject;
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const ProjectCard = ({ project, userSkillStrings, onApply }: ProjectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Extract all skills from all tasks for this project
  const allProjectSkills = project.sub_tasks?.flatMap(task => 
    task.skill_requirements?.map(skill => 
      typeof skill === 'string' ? skill : skill.skill
    ) || []
  ) || [];

  // Calculate how many of the user's skills match this project
  const matchingSkills = allProjectSkills.filter(skill => 
    userSkillStrings.includes(skill.toLowerCase())
  );

  // Calculate match percentage
  const matchPercentage = allProjectSkills.length > 0
    ? Math.round((matchingSkills.length / allProjectSkills.length) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{project.title || "Untitled Project"}</h3>
              <p className="text-sm text-muted-foreground">
                {project.company_name || "Unknown Company"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm">
                <span className="font-medium">Skill Match: </span>
                <Badge variant={matchPercentage > 70 ? "default" : "outline"}>
                  {matchPercentage}%
                </Badge>
              </div>
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {project.sub_tasks?.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userSkillStrings={userSkillStrings}
                  onApply={() => onApply(project, task)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1 mt-2">
          {allProjectSkills.slice(0, 5).map((skill, index) => (
            <Badge 
              key={index} 
              variant={userSkillStrings.includes(skill.toLowerCase()) ? "default" : "outline"}
              className="text-xs"
            >
              {skill}
            </Badge>
          ))}
          {allProjectSkills.length > 5 && (
            <span className="text-xs text-muted-foreground">
              +{allProjectSkills.length - 5} more
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
