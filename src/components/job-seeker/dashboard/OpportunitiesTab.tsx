
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "./opportunities/EmptyState";
import { FilterSection } from "./opportunities/FilterSection";
import { ProjectCard } from "./opportunities/ProjectCard";
import { TaskCard } from "./opportunities/TaskCard";
import { ApplyDialog } from "./opportunities/ApplyDialog";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { calculateSkillMatch, convertSkillsToStrings } from "@/utils/skillMatching";
import { toast } from "sonner";

interface OpportunitiesTabProps {
  projects: EquityProject[] | undefined;
  userSkills: (Skill | string)[];
}

export const OpportunitiesTab = ({ projects = [], userSkills = [] }: OpportunitiesTabProps) => {
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [activeTab, setActiveTab] = useState("projects");
  const [filters, setFilters] = useState({ search: "", sortBy: "newest", filterBy: "all" });
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<EquityProject | null>(null);
  const [selectedTask, setSelectedTask] = useState<SubTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSkillStrings, setUserSkillStrings] = useState<string[]>([]);

  useEffect(() => {
    // Convert user skills to lowercase strings for easier matching
    setUserSkillStrings(convertSkillsToStrings(userSkills));
  }, [userSkills]);

  useEffect(() => {
    if (!projects) {
      setFilteredProjects([]);
      return;
    }

    let result = [...projects];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(project => {
        const titleMatch = project.title?.toLowerCase().includes(searchTerm);
        const descMatch = project.business_roles?.description?.toLowerCase().includes(searchTerm);
        const companyMatch = project.business_roles?.company_name?.toLowerCase().includes(searchTerm);
        
        // Check in sub_tasks
        const taskMatch = project.sub_tasks?.some(task => 
          task.title?.toLowerCase().includes(searchTerm) || 
          task.description?.toLowerCase().includes(searchTerm)
        );
        
        return titleMatch || descMatch || companyMatch || taskMatch;
      });
    }

    // Apply filters
    if (filters.filterBy === "match") {
      result = result.filter(project => {
        // Check if any sub_task has matching skills
        return project.sub_tasks?.some(task => {
          const skillReqs = task.skill_requirements || [];
          return calculateSkillMatch(userSkills, skillReqs) > 0;
        });
      });
    } else if (filters.filterBy === "recent") {
      // Filter for projects created in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      result = result.filter(project => {
        const createdAt = project.start_date ? new Date(project.start_date) : null;
        return createdAt && createdAt > oneWeekAgo;
      });
    } else if (filters.filterBy === "high-equity") {
      // Filter for projects with >10% equity
      result = result.filter(project => 
        project.sub_tasks?.some(task => (task.equity_allocation || 0) > 10)
      );
    }

    // Apply sorting
    if (filters.sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateB - dateA;
      });
    } else if (filters.sortBy === "oldest") {
      result.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
    } else if (filters.sortBy === "equity-high") {
      result.sort((a, b) => {
        const equityA = Math.max(...(a.sub_tasks?.map(t => t.equity_allocation || 0) || [0]));
        const equityB = Math.max(...(b.sub_tasks?.map(t => t.equity_allocation || 0) || [0]));
        return equityB - equityA;
      });
    } else if (filters.sortBy === "equity-low") {
      result.sort((a, b) => {
        const equityA = Math.min(...(a.sub_tasks?.map(t => t.equity_allocation || 0).filter(e => e > 0) || [100]));
        const equityB = Math.min(...(b.sub_tasks?.map(t => t.equity_allocation || 0).filter(e => e > 0) || [100]));
        return equityA - equityB;
      });
    } else if (filters.sortBy === "match-high") {
      // Sort by best skill match
      result.sort((a, b) => {
        const matchA = a.skill_match || 0;
        const matchB = b.skill_match || 0;
        return matchB - matchA;
      });
    }

    setFilteredProjects(result);
  }, [projects, filters, userSkills]);

  const handleFilterChange = (newFilters: { search: string; sortBy: string; filterBy: string }) => {
    setFilters(newFilters);
  };

  const handleApply = (project: EquityProject, task: SubTask) => {
    setSelectedProject(project);
    setSelectedTask(task);
    setIsApplyDialogOpen(true);
  };

  const handleSubmitApplication = async (message: string) => {
    if (!selectedProject || !selectedTask) {
      toast.error("No project or task selected");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Mock application submission for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Application submitted successfully");
      setIsApplyDialogOpen(false);
      setSelectedProject(null);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterSection onFilterChange={handleFilterChange} />
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="tasks">Individual Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects">
              {filteredProjects.length === 0 ? (
                <EmptyState searchTerm={filters.search} />
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      userSkillStrings={userSkillStrings}
                      onApply={handleApply}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tasks">
              {filteredProjects.length === 0 ? (
                <EmptyState searchTerm={filters.search} />
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map(project => (
                    <div key={project.id} className="border rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        {project.title || "Untitled Project"}
                      </h3>
                      
                      {project.sub_tasks?.map(task => (
                        <TaskCard
                          key={task.id}
                          project={project}
                          task={task}
                          userSkillStrings={userSkillStrings}
                          onApply={handleApply}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <ApplyDialog
        isOpen={isApplyDialogOpen}
        onOpenChange={setIsApplyDialogOpen}
        project={selectedProject}
        task={selectedTask}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
