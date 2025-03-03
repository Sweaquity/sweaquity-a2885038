
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Search, Star, Clock, FileText, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { SkillBadge } from "./SkillBadge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [filterSkill, setFilterSkill] = useState<string | null>(null);

  // Convert user skills to lowercase strings for comparison
  const userSkillStrings = useMemo(() => {
    return userSkills.map(skill => {
      if (typeof skill === 'string') {
        return String(skill).toLowerCase();
      }
      if (skill && typeof skill.skill === 'string') {
        return skill.skill.toLowerCase();
      }
      return '';
    }).filter(Boolean);
  }, [userSkills]);

  // Filter projects based on search term and selected skill
  useEffect(() => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        // Check against project title
        if (project.title && project.title.toLowerCase().includes(term)) return true;
        
        // Check against business name
        if (project.business_roles?.company_name && 
            String(project.business_roles.company_name).toLowerCase().includes(term)) return true;
        
        // Check against project description
        const projectDescription = project.business_roles?.description;
        if (projectDescription && String(projectDescription).toLowerCase().includes(term)) return true;
        
        // Check against task title
        const taskTitle = project.business_roles?.title;
        if (taskTitle && String(taskTitle).toLowerCase().includes(term)) return true;
        
        return false;
      });
    }

    if (filterSkill) {
      filtered = filtered.filter(project => {
        const requirements = project.sub_tasks?.flatMap(task => task.skill_requirements || []) || [];
        
        return requirements.some(req => {
          if (typeof req === 'string') {
            return String(req).toLowerCase() === filterSkill.toLowerCase();
          }
          if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
            return String(req.skill).toLowerCase() === filterSkill.toLowerCase();
          }
          return false;
        });
      });
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterSkill]);

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

  // Extract unique skills from all projects for filtering
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    
    projects.forEach(project => {
      project.sub_tasks?.forEach(task => {
        const requirements = task.skill_requirements || [];
        requirements.forEach(req => {
          if (typeof req === 'string') {
            skillsSet.add(String(req).toLowerCase());
          } else if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
            skillsSet.add(String(req.skill).toLowerCase());
          }
        });
      });
    });
    
    return Array.from(skillsSet);
  }, [projects]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, companies or skills..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full md:w-auto flex flex-wrap gap-2">
          {allSkills.slice(0, 5).map((skill, index) => (
            <Badge 
              key={index} 
              variant={filterSkill === skill ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterSkill(filterSkill === skill ? null : skill)}
            >
              {skill}
            </Badge>
          ))}
          {allSkills.length > 5 && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => {}}>
              +{allSkills.length - 5} more
            </Badge>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Matching Opportunities</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any opportunities matching your criteria. Try adjusting your search or check back later.
            </p>
            {searchTerm || filterSkill ? (
              <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterSkill(null); }}>
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden border border-border">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {project.title || "Untitled Project"}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {project.business_roles?.company_name || "Unknown Company"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-500" />
                    {/* Use skill_match if it exists, otherwise use 0 */}
                    {project.skill_match ?? 0}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {(project.sub_tasks || []).map((task) => (
                  <div key={task.id} className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                    <div className="space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className="font-semibold text-base">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="flex items-center">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {task.equity_allocation}% Equity
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.timeframe}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(task.skill_requirements || []).map((req, idx) => {
                            const skillName = typeof req === 'string' ? req : 
                                        (req && typeof req === 'object' && 'skill' in req) ? 
                                        req.skill : '';
                                        
                            if (!skillName) return null;
                            
                            const skillLower = String(skillName).toLowerCase();
                            const isUserSkill = userSkillStrings.includes(skillLower);
                            
                            return (
                              <SkillBadge 
                                key={idx} 
                                skill={{ skill: skillName, level: "Intermediate" }} 
                                isUserSkill={isUserSkill} 
                              />
                            );
                          })}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleApply(project, task)}
                        className="w-full sm:w-auto mt-2"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Apply for this role
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
