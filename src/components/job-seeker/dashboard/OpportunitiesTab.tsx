
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject, Skill } from "@/types/jobSeeker";
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

// ProjectSubTask type that matches the TaskCard component
interface ProjectSubTask {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  skills_required: string[];
  skill_requirements: Array<{skill: string, level: string}>;
  equity_allocation: number;
  timeframe: string;
  status: string;
  task_status: string;
  completion_percentage: number;
  matchedSkills?: string[];
  matchScore?: number;
  id?: string;
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const [unavailableTaskIds, setUnavailableTaskIds] = useState<Set<string>>(new Set());
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<Record<string, {title: string, company: string}>>({}); 
  
  // Enhanced logging: Log projects received by this component with source information
  useEffect(() => {
    console.log("OpportunitiesTab received projects:", projects.length);
    console.log("Project sources:", projects.map(p => ({
      id: p.id,
      project_id: p.project_id,
      title: p.title || "No title",
      company: p.business_roles?.company_name || "No company",
      created_by: p.created_by || "Unknown creator",
      sub_tasks_count: p.sub_tasks?.length || 0
    })));
    
    // Fetch additional project details if needed
    const fetchProjectDetails = async () => {
      // Get all unique project IDs
      const projectIds = [...new Set(projects.map(p => p.project_id))];
      
      if (projectIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            project_id,
            title,
            businesses (
              company_name
            )
          `)
          .in('project_id', projectIds);
          
        if (error) throw error;
        
        if (data) {
          const details: Record<string, {title: string, company: string}> = {};
          data.forEach(item => {
            // Fix: Properly type and access businesses data
            if (item.businesses && typeof item.businesses === 'object') {
              const companyName = item.businesses.company_name || 'Unknown Company';
              details[item.project_id] = {
                title: item.title || 'Unnamed Project',
                company: companyName
              };
            } else {
              details[item.project_id] = {
                title: item.title || 'Unnamed Project',
                company: 'Unknown Company'
              };
            }
          });
          setProjectDetails(details);
          console.log("Fetched additional project details:", details);
        }
      } catch (err) {
        console.error("Error fetching project details:", err);
      }
    };
    
    fetchProjectDetails();
    
    // Log all sub-tasks for debugging
    if (projects.length > 0) {
      const allSubTasks = projects.flatMap(p => p.sub_tasks || []);
      console.log(`Total sub-tasks across all projects: ${allSubTasks.length}`);
      console.log("Sample of sub-tasks:", allSubTasks.slice(0, 5).map(t => ({
        task_id: t.task_id,
        project_id: t.project_id,
        title: t.title,
        skills_required: t.skills_required
      })));
    }
  }, [projects]);
  
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
        console.log("OpportunitiesTab - Unavailable task IDs:", Array.from(unavailableIds));
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
  
  // Enhanced logging: Log filtered projects
  console.log("OpportunitiesTab - After filtering unavailable tasks:", 
    filteredProjects.length, 
    "projects remain with", 
    filteredProjects.reduce((acc, proj) => acc + (proj.sub_tasks?.length || 0), 0), 
    "total tasks"
  );
  
  // Group tasks by business for better visualization
  const projectsByBusiness = filteredProjects.reduce((acc, project) => {
    const businessName = project.business_roles?.company_name || "Unknown Business";
    if (!acc[businessName]) {
      acc[businessName] = [];
    }
    acc[businessName].push(project);
    return acc;
  }, {} as Record<string, EquityProject[]>);
  
  console.log("Projects grouped by business:", Object.keys(projectsByBusiness).map(business => ({
    business,
    projectCount: projectsByBusiness[business].length,
    taskCount: projectsByBusiness[business].reduce(
      (acc, proj) => acc + (proj.sub_tasks?.length || 0), 0
    )
  })));
  
  const matchedProjects = getProjectMatches(filteredProjects, userSkills);

  // Enhanced logging: Log matched projects
  console.log("OpportunitiesTab - After skill matching:", 
    matchedProjects.length, 
    "matched projects with scores:", 
    matchedProjects.map(p => ({ 
      projectId: p.projectId, 
      title: p.projectTitle,
      businessName: p.projectCompany || "Unknown Business",
      score: Math.round(p.matchScore), 
      tasks: p.matchedTasks.length 
    }))
  );

  const handleProjectToggle = (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
    }
  };

  // Get project details from either state or fallback to matched project data
  const getProjectInfo = (projectId: string, fallbackTitle: string) => {
    if (projectDetails[projectId]) {
      return projectDetails[projectId];
    }
    
    const matchedProject = matchedProjects.find(p => p.projectId === projectId);
    return {
      title: fallbackTitle,
      company: matchedProject?.projectCompany || 'Unknown Company'
    };
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
          Projects and tasks that match your skills from all businesses
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
          {matchedProjects.map((project) => {
            const projectInfo = getProjectInfo(project.projectId, project.projectTitle);
            
            return (
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                    <span className="font-medium">{projectInfo.title}</span>
                    <div className="flex flex-wrap items-center gap-2">
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
                      <Badge variant="outline" className="ml-auto">
                        {projectInfo.company}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-4">
                    {project.matchedTasks
                      .sort((a, b) => b.matchScore - a.matchScore)
                      .map((task) => {
                        // Convert MatchedTask to ProjectSubTask with required properties
                        const projectSubTask: ProjectSubTask = {
                          task_id: task.task_id, 
                          project_id: project.projectId,
                          title: task.title,
                          description: task.description,
                          equity_allocation: task.equity_allocation,
                          timeframe: task.timeframe,
                          skills_required: task.skills_required || [],
                          skill_requirements: task.skills_required?.map(skill => ({
                            skill,
                            level: "Intermediate" // Using an allowed level value
                          })) || [],
                          status: 'open',
                          task_status: 'open',
                          completion_percentage: 0,
                          matchScore: task.matchScore,
                          matchedSkills: task.matchedSkills
                        };
                        
                        // Debug log to check task data
                        console.log("OpportunitiesTab - Task data for card:", {
                          taskId: projectSubTask.task_id,
                          projectId: projectSubTask.project_id,
                          taskTitle: projectSubTask.title,
                          company: projectInfo.company
                        });
                        
                        return (
                          <TaskCard 
                            key={projectSubTask.task_id}
                            task={projectSubTask}
                            userSkills={userSkills}
                            showMatchedSkills={true}
                            companyName={projectInfo.company}
                            projectTitle={projectInfo.title}
                          />
                        );
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
