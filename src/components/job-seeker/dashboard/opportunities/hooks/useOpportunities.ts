
import { useState, useEffect, useMemo } from "react";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { 
  filterProjects, 
  extractUniqueSkills, 
  convertUserSkillsToStrings 
} from "@/utils/skillMatching";

export const useOpportunities = (projects: EquityProject[], userSkills: Skill[]) => {
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
      const creationDate = opp.updated_at || opp.start_date || null;
      if (!creationDate) return false;
      
      // Consider opportunities created in the last 7 days as "new"
      return new Date(creationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length;
    
    // Instead of showing 0, let's not show any notification
    setNewOpportunities(recentOpportunities);
  }, [projects]);

  return {
    searchTerm,
    setSearchTerm,
    filterSkill,
    setFilterSkill,
    filteredProjects,
    newOpportunities,
    userSkillStrings,
    allSkills
  };
};
