
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Briefcase,
  Building,
} from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Link } from "react-router-dom";
import { OpportunityMatch } from "@/hooks/useJobSeekerDashboard";

interface ProjectCardProps {
  project: OpportunityMatch;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{project.business_name || "Company"}</span>
            </div>
          </div>
          <Badge>{project.score}% match</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-3">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>
              {project.matchedTasks}{" "}
              {project.matchedTasks === 1 ? "task" : "tasks"} match your skills
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {project.tasks
              ?.flatMap((t) => t.matchedSkills || [])
              .filter((skill, index, self) => self.indexOf(skill) === index)
              .slice(0, 3)
              .map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            {project.tasks &&
              project.tasks.flatMap((t) => t.matchedSkills || []).filter(
                (skill, index, self) => self.indexOf(skill) === index
              ).length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +
                  {project.tasks.flatMap((t) => t.matchedSkills || []).filter(
                    (skill, index, self) => self.indexOf(skill) === index
                  ).length - 3}{" "}
                  more
                </span>
              )}
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <Link 
            to={`/projects/apply/${project.project_id}`} 
            className="w-full block"
          >
            <Button className="w-full">Apply Now</Button>
          </Link>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" /> View Tasks
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">Matching Tasks</h4>
            {project.tasks
              ?.filter(task => task.matchScore && task.matchScore > 0)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  matchScore={task.matchScore}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
