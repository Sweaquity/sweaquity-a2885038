
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillBadge } from "./SkillBadge";
import { TaskCard } from "./TaskCard";
import { Skill } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";

interface OpportunitiesTabProps {
  projects: any[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  
  // Effect to analyze skills match and sort projects
  useEffect(() => {
    if (!projects || !userSkills) return;
    
    // Extract user skill names for easier matching
    const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
    
    // Process projects and calculate match scores
    const processedProjects = projects.map(project => {
      // Skip if no subTasks
      if (!project.subTasks || project.subTasks.length === 0) {
        return { ...project, matchedTasks: 0, score: 0 };
      }
      
      // Process each task to calculate skill match
      const processedTasks = project.subTasks.map((task: any) => {
        const taskRequiredSkills = task.skill_requirements?.map((r: any) => r.skill) || 
                                  task.skills_required || [];
        
        if (!taskRequiredSkills.length) return { ...task, matchedSkills: [], matchScore: 0 };
        
        // Find matching skills
        const matchedSkills = taskRequiredSkills.filter((skill: string) => 
          userSkillNames.includes(skill.toLowerCase())
        );
        
        // Calculate match percentage
        const matchScore = Math.round((matchedSkills.length / taskRequiredSkills.length) * 100);
        
        console.log("Task match results:", {
          title: task.title,
          matchedSkills,
          totalRequired: taskRequiredSkills.length,
          matchScore
        });
        
        return {
          ...task,
          matchedSkills,
          matchScore
        };
      });
      
      // Only count tasks with at least one skill match
      const matchedTasks = processedTasks.filter((task: any) => task.matchScore > 0).length;
      
      // Calculate overall project match score (percentage of matched tasks)
      const score = project.subTasks.length > 0 
        ? Math.round((matchedTasks / project.subTasks.length) * 100)
        : 0;
        
      if (matchedTasks > 0) {
        console.log("Project match summary:", {
          title: project.title,
          matchedTasks,
          score
        });
      }
      
      return {
        ...project,
        subTasks: processedTasks,
        matchedTasks,
        score
      };
    });
    
    // Sort projects by match score (highest first)
    const sorted = [...processedProjects].sort((a, b) => b.score - a.score);
    
    // Show all opportunities regardless of match score
    setFilteredProjects(sorted);
  }, [projects, userSkills]);

  const handleApplyClick = (projectId: string, taskId: string) => {
    navigate(`/projects/${projectId}/apply?taskId=${taskId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No matching opportunities found.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {filteredProjects.map((project) => (
              <AccordionItem key={project.project_id} value={project.project_id}>
                <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-lg">
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      {project.score > 0 && (
                        <Badge>
                          {project.score}% match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.description?.substring(0, 100)}
                      {project.description?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <div className="space-y-4">
                    {project.subTasks.map((task: any) => (
                      <TaskCard
                        key={task.task_id}
                        title={task.title}
                        description={task.description}
                        equity={task.equity_allocation}
                        timeframe={task.timeframe}
                        skills={task.skill_requirements?.map((r: any) => r.skill) || task.skills_required || []}
                        matchScore={task.matchScore}
                        onApply={() => handleApplyClick(project.project_id, task.task_id)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
