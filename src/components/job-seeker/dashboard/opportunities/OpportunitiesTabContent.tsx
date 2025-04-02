
import { useState, useEffect } from "react";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { ProjectsList } from "./ProjectsList";
import { FilterSection } from "./FilterSection";
import { useOpportunities } from "./hooks/useOpportunities";

interface OpportunitiesTabContentProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTabContent = ({ 
  projects, 
  userSkills 
}: OpportunitiesTabContentProps) => {
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    filterSkill,
    setFilterSkill,
    filteredProjects,
    newOpportunities,
    userSkillStrings,
    allSkills
  } = useOpportunities(projects, userSkills);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSkill(null);
  };

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
        <ProjectsList 
          projects={filteredProjects}
          userSkillStrings={userSkillStrings}
          onApply={handleApply}
        />
      )}
    </div>
  );
};
