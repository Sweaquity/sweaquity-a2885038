
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { TaskCard } from "./TaskCard";
import { getProjectMatches } from "@/utils/skillMatching";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const matchedProjects = getProjectMatches(projects, userSkills);

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
                    .map((task) => (
                      <TaskCard 
                        key={task.id}
                        task={task}
                        userSkills={userSkills}
                      />
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
