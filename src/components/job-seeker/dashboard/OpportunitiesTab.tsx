
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { TaskCard } from "./TaskCard";
import { getSkillMatchCount } from "@/utils/skillMatching";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  // Get all tasks from all projects and sort them by skill match
  const matchedTasks = projects.flatMap(project => 
    (project.sub_tasks || []).map(task => ({
      ...task,
      projectId: project.project_id,
      projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
      matchCount: getSkillMatchCount(task.skill_requirements, userSkills)
    }))
  ).filter(task => task.matchCount > 0)
  .sort((a, b) => b.matchCount - a.matchCount);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Matched Skills Tasks</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matchedTasks.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              userSkills={userSkills}
            />
          ))}
          {matchedTasks.length === 0 && (
            <p className="text-muted-foreground">No matching tasks found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
