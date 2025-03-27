import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { ProjectCard } from "./opportunities/ProjectCard";
import { FilterSection } from "./opportunities/FilterSection";
import { EmptyState } from "./opportunities/EmptyState";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  filterProjects, 
  extractUniqueSkills, 
  convertUserSkillsToStrings 
} from "@/utils/skillMatching";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [filterSkill, setFilterSkill] = useState<string | null>(null);
  const [newOpportunities, setNewOpportunities] = useState<number>(0);

  // Convert user skills to lowercase strings for comparison
  const userSkillStrings = useMemo(() => {
    return convertUserSkillsToStrings(userSkills);
  }, [userSkills]);

  // Extract unique skills from all projects for filtering
  const allSkills = useMemo(() => {
    return extractUniqueSkills(projects);
  }, [projects]);

  // Filter projects based on search term and selected skill
  useEffect(() => {
    const filtered = filterProjects(projects, searchTerm, filterSkill);
    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterSkill]);

  // Calculate new opportunities
  useEffect(() => {
    // Count new opportunities based on recent creation date
    const recentOpportunities = projects.filter(opp => {
      const creationDate = opp.created_at || opp.start_date || null;
      if (!creationDate) return false;
      
      // Consider opportunities created in the last 7 days as "new"
      return new Date(creationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length;
    
    // Instead of showing 0, let's not show any notification
    setNewOpportunities(recentOpportunities);
  }, [projects]);

  const handleApply = async (project: EquityProject, task: SubTask) => {
    try {
      // Verify project and task exist
      const { data: projectData, error: projectError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('project_id', project.project_id)
        .single();
        
      if (projectError || !projectData) {
        console.error("Project validation error:", projectError);
        toast.error("Project not found or no longer available");
        return;
      }
      
      const { data: taskData, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', task.id)
        .single();
        
      if (taskError || !taskData) {
        console.error("Task validation error:", taskError);
        toast.error("This opportunity is no longer available");
        return;
      }
        
      navigate(`/projects/${project.project_id}/apply`, { 
        state: { 
          taskId: task.id, 
          projectId: project.project_id,
          projectTitle: project.title || "Untitled Project",
          taskTitle: task.title || "Untitled Task"
        } 
      });
    } catch (error) {
      console.error("Navigate error:", error);
      toast.error("Unable to apply for this role. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSkill(null);
  };

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <div className="space-y-4">
      <FilterSection
        allSkills={allSkills}
        searchTerm={searchTerm}
        filterSkill={filterSkill}
        onSearchChange={setSearchTerm}
        onFilterSkillChange={setFilterSkill}
        newOpportunities={newOpportunities > 0 ? newOpportunities : undefined}
      />

      {filteredProjects.length === 0 ? (
        <EmptyState 
          hasFilters={!!searchTerm || !!filterSkill} 
          onClearFilters={clearFilters} 
        />
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userSkillStrings={userSkillStrings}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
