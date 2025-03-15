
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skill, EquityProject, SubTask } from '@/types/jobSeeker';
import { ProjectCard } from './opportunities/ProjectCard';
import { ProjectApplyDialog } from './opportunities/ProjectApplyDialog';
import { TaskCard } from './opportunities/TaskCard';
import { 
  filterProjectsBySkillMatch, 
  filterProjectsWithMatchingTasks 
} from '@/utils/skillMatching';
import { skillsToStrings } from '@/utils/skillHelpers';

interface OpportunitiesTabProps {
  projects: EquityProject[];
  skills: Skill[];
  onOpportunityApply: (projectId: string, taskId: string, message: string) => Promise<void>;
}

export const OpportunitiesTab = ({ projects, skills, onOpportunityApply }: OpportunitiesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [selectedProject, setSelectedProject] = useState<EquityProject | null>(null);
  const [selectedTask, setSelectedTask] = useState<SubTask | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Convert user skills to strings for easier matching
  const userSkillsStrings = skillsToStrings(skills);

  // Filter and search projects
  useEffect(() => {
    let results = [...projects];
    
    // Apply tab filter
    if (filterType === 'match') {
      results = filterProjectsBySkillMatch(results, skills);
    } else if (filterType === 'recent') {
      results = [...results].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(project => {
        // Search in project title
        if (project.title && project.title.toLowerCase().includes(term)) return true;
        
        // Search in project description
        if (project.description && project.description.toLowerCase().includes(term)) return true;
        
        // Search in tasks
        if (project.tasks && project.tasks.some(task => 
          (task.title && task.title.toLowerCase().includes(term)) || 
          (task.description && task.description.toLowerCase().includes(term))
        )) return true;
        
        // Search in skills required
        if (project.skills_required && project.skills_required.some(skill => 
          skill.toLowerCase().includes(term)
        )) return true;
        
        return false;
      });
    }
    
    setFilteredProjects(results);
  }, [projects, filterType, searchTerm, skills]);

  const handleSelectProject = (project: EquityProject) => {
    setSelectedProject(project);
  };

  const handleSelectTask = (task: SubTask) => {
    setSelectedTask(task);
    setIsApplyDialogOpen(true);
  };

  const handleApply = async (message: string) => {
    if (!selectedProject || !selectedTask) return;
    
    try {
      setIsApplying(true);
      await onOpportunityApply(selectedProject.project_id || '', selectedTask.id || '', message);
      setIsApplyDialogOpen(false);
      
      // Remove applied project from list
      setFilteredProjects(prev => 
        prev.filter(p => p.project_id !== selectedProject.project_id)
      );
      
      setSelectedProject(null);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error applying to opportunity:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative flex-1">
          <Input
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        <Tabs value={filterType} onValueChange={setFilterType} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="match">Skill Match</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No Opportunities Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {projects.length === 0 
              ? "We couldn't find any opportunities. Please check back later!" 
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.project_id || project.id}
              project={project}
              userSkills={skills}
              onSelectProject={() => handleSelectProject(project)}
              onSelectTask={handleSelectTask}
            />
          ))}
        </div>
      )}

      <ProjectApplyDialog
        open={isApplyDialogOpen}
        onOpenChange={setIsApplyDialogOpen}
        onApply={handleApply}
        project={selectedProject}
        task={selectedTask}
        isLoading={isApplying}
      />
    </div>
  );
};
