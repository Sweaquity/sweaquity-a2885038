
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { TaskCard } from "./TaskCard";
import { getProjectMatches } from "@/utils/skillMatching";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

interface ExtendedSubTask extends SubTask {
  matchScore?: number;
  matchedSkills?: string[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const [unavailableTaskIds, setUnavailableTaskIds] = useState<Set<string>>(new Set());
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  
  // Fetch user applications to filter out tasks that have already been applied for
  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get user's existing applications
        const { data: userApplications, error: applicationsError } = await supabase
          .from('job_applications')
          .select('task_id, status')
          .eq('user_id', session.user.id);

        if (applicationsError) throw applicationsError;

        // Create set of task IDs that are not available (anything except withdrawn and rejected)
        const unavailableIds = new Set(
          userApplications
            ?.filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
            .map(app => app.task_id) || []
        );
        
        setUnavailableTaskIds(unavailableIds);
        console.log("Unavailable task IDs:", Array.from(unavailableIds));
      } catch (error) {
        console.error("Error fetching user applications:", error);
      }
    };

    fetchUserApplications();
  }, []);

  // Filter projects to remove tasks that have already been applied for
  const filteredProjects = projects.map(project => ({
    ...project,
    sub_tasks: project.sub_tasks?.filter(task => !unavailableTaskIds.has(task.task_id)) || []
  })).filter(project => project.sub_tasks && project.sub_tasks.length > 0);
  
  const matchedProjects = getProjectMatches(filteredProjects, userSkills);

  const handleProjectToggle = (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
    }
  };

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
        <Accordion 
          type="single" 
          collapsible 
          className="space-y-4"
          value={expandedProjectId || undefined}
          onValueChange={setExpandedProjectId}
        >
          {matchedProjects.map((project) => (
            <AccordionItem 
              key={project.projectId} 
              value={project.projectId}
              className="border rounded-lg p-2"
            >
              <AccordionTrigger 
                className="hover:no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleProjectToggle(project.projectId);
                }}
              >
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
                      // Convert MatchedTask to ExtendedSubTask with required properties and matched skills
                      const extendedTask: ExtendedSubTask = {
                        ...task,
                        task_id: task.task_id, 
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
                          key={extendedTask.task_id}
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
