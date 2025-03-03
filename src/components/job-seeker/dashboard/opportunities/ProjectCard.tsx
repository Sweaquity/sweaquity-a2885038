
import { EquityProject, SubTask } from "@/types/jobSeeker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Star } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { calculateSkillMatch } from "@/utils/skillMatching";

interface ProjectCardProps {
  project: EquityProject;
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const ProjectCard = ({ project, userSkillStrings, onApply }: ProjectCardProps) => {
  // Calculate skill match percentage if not already provided
  const skillMatchPercentage = project.skill_match ?? calculateSkillMatch(
    userSkillStrings.map(skill => ({ skill, level: "Intermediate" })),
    project.sub_tasks?.flatMap(task => task.skill_requirements || []) || []
  );

  return (
    <Card key={project.id} className="overflow-hidden border border-border">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {project.title || "Untitled Project"}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Briefcase className="h-4 w-4 mr-1" />
              {project.business_roles?.company_name || "Unknown Company"}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-amber-500" />
            {skillMatchPercentage}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {(project.sub_tasks || []).map((task) => (
          <TaskCard 
            key={task.id}
            project={project}
            task={task}
            userSkillStrings={userSkillStrings}
            onApply={onApply}
          />
        ))}
      </CardContent>
    </Card>
  );
};
