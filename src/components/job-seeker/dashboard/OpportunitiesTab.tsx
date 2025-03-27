
import { useState, useEffect } from "react";
import { FilterSection } from "./opportunities/FilterSection";
import { ProjectCard } from "./opportunities/ProjectCard";
import { EmptyState } from "./opportunities/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EquityProject, Skill } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [filters, setFilters] = useState({ 
    search: "",
    sortBy: "latest",
    filterBy: "all"
  });

  // Derive available skills from the projects
  const availableSkills = projects
    .flatMap(project => project.sub_tasks || [])
    .flatMap(task => task.skill_requirements || [])
    .filter((skill, index, self) => {
      // Filter unique skills
      const skillName = typeof skill === 'string' ? skill : skill.skill;
      return index === self.findIndex(s => {
        const sName = typeof s === 'string' ? s : s.skill;
        return sName === skillName;
      });
    })
    .map(skill => typeof skill === 'string' ? { skill } : skill);

  // Process the projects when filters change
  useEffect(() => {
    const { search, sortBy, filterBy } = filters;
    
    let result = [...projects];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(project => {
        const titleMatch = project.title?.toLowerCase().includes(searchLower);
        const descMatch = project.business_roles?.description?.toLowerCase().includes(searchLower);
        const companyMatch = project.business_roles?.company_name?.toLowerCase().includes(searchLower);
        
        // Check if any subtask has the skill
        const skillMatch = project.sub_tasks?.some(task => 
          task.skill_requirements?.some(skill => {
            const skillName = typeof skill === 'string' ? skill : skill.skill;
            return skillName.toLowerCase().includes(searchLower);
          })
        );
        
        return titleMatch || descMatch || companyMatch || skillMatch;
      });
    }
    
    // Apply category filter
    if (filterBy === "matched") {
      result = result.filter(project => {
        return project.skill_match && project.skill_match > 0;
      });
    } else if (filterBy === "recent") {
      // Filter to only show projects from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      result = result.filter(project => {
        const projectDate = new Date(project.created_at || project.start_date);
        return projectDate > oneWeekAgo;
      });
    }
    
    // Apply sorting
    if (sortBy === "equity") {
      result.sort((a, b) => (b.equity_amount || 0) - (a.equity_amount || 0));
    } else if (sortBy === "match") {
      result.sort((a, b) => (b.skill_match || 0) - (a.skill_match || 0));
    } else {
      // Default sort by latest
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || a.start_date).getTime();
        const dateB = new Date(b.created_at || b.start_date).getTime();
        return dateB - dateA;
      });
    }
    
    setFilteredProjects(result);
  }, [filters, projects]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Opportunities</h2>
        <p className="text-sm text-muted-foreground">
          Discover projects that match your skills and interests.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <FilterSection 
          onFilterChange={setFilters} 
          availableSkills={availableSkills}
        />
        
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                userSkills={userSkills}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
};
