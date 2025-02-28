
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { TaskCard } from "./TaskCard";
import { getProjectMatches } from "@/utils/skillMatching";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

interface ExtendedSubTask extends SubTask {
  matchScore?: number;
  matchedSkills?: string[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  console.log("Opportunities tab projects:", projects);
  console.log("User skills:", userSkills);
  
  useEffect(() => {
    // Debug logging for project IDs
    console.log("All project IDs:", projects.map(p => p.id));
    
    // Look for specific project ID
    const hasSpecificProject = projects.some(p => p.id === "672387b6-6065-4d25-94c9-82f85e87dafc");
    console.log("Contains specific project ID?", hasSpecificProject);
    
    // Log each project's structure to debug
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`, {
        id: project.id,
        project_id: project.project_id,
        title: project.title,
        subTasksCount: project.sub_tasks?.length || 0
      });
    });
  }, [projects]);

  const matchedProjects = getProjectMatches(projects, userSkills);
  
  console.log("Matched projects after filtering:", matchedProjects);

  if (matchedProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Matched Opportunities</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No matching opportunities found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adding more skills to your profile to see matching projects.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Matched Opportunities</h2>
        <p className="text-sm text-muted-foreground">
          Projects and tasks that match your skills
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {matchedProjects.map((project) => (
            <AccordionItem 
              key={project.projectId} 
              value={project.projectId}
              className="border rounded-lg p-2"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{project.projectTitle}</span>
                  <Badge 
                    variant="secondary"
                    className={
                      project.matchScore >= 75 
                        ? 'bg-green-100 text-green-800' 
                        : project.matchScore >= 50 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                    }
                  >
                    {Math.round(project.matchScore)}% Match
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {project.matchedTasks.length} matching tasks
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-4">
                  {project.matchedTasks
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .map((task) => {
                      console.log("Rendering matched task:", {
                        id: task.id,
                        title: task.title,
                        matchScore: task.matchScore,
                        matchedSkills: task.matchedSkills
                      });
                      
                      // Convert MatchedTask to ExtendedSubTask with required properties and matched skills
                      const extendedTask: ExtendedSubTask = {
                        ...task,
                        project_id: project.projectId,
                        skill_requirements: task.matchedSkills?.map(skill => ({
                          skill,
                          level: "Intermediate" // Using an allowed level value from the enum
                        })) || [],
                        status: 'open',
                        task_status: 'open',
                        completion_percentage: 0,
                        matchScore: task.matchScore,
                        matchedSkills: task.matchedSkills
                      };
                      
                      return (
                        <TaskCard 
                          key={task.id}
                          task={extendedTask}
                          userSkills={userSkills}
                          showMatchedSkills={true}
                        />
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
