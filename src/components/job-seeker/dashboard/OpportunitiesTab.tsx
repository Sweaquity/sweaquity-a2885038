import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Clock, Briefcase, Calendar, ArrowUpDown } from "lucide-react";
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApplyToProjectDialog } from "../ApplyToProjectDialog";
import { supabase } from "@/lib/supabase";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects = [], userSkills = [] }: OpportunitiesTabProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<EquityProject | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("skill_match");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({
    timeframe: "",
    minEquity: "",
    maxEquity: "",
    skillMatch: true,
  });

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const titleMatch = project.title?.toLowerCase().includes(term);
        const companyMatch = project.company_name?.toLowerCase().includes(term);
        const skillsMatch = project.sub_tasks?.some((task) =>
          task.skill_requirements?.some((skill) => {
            const skillName = typeof skill === "string" ? skill : skill.skill;
            return skillName.toLowerCase().includes(term);
          })
        );
        
        if (!titleMatch && !companyMatch && !skillsMatch) {
          return false;
        }
      }
      
      // Timeframe filter
      if (filters.timeframe && project.time_allocated) {
        if (filters.timeframe === "< 3 months" && !project.time_allocated.includes("< 3")) {
          return false;
        }
        if (filters.timeframe === "3-6 months" && !project.time_allocated.includes("3-6")) {
          return false;
        }
        if (filters.timeframe === "> 6 months" && !project.time_allocated.includes("> 6")) {
          return false;
        }
      }
      
      // Equity range filter
      if (filters.minEquity && project.equity_amount < parseFloat(filters.minEquity)) {
        return false;
      }
      if (filters.maxEquity && project.equity_amount > parseFloat(filters.maxEquity)) {
        return false;
      }
      
      // Skill match filter
      if (filters.skillMatch && userSkills.length > 0) {
        const hasSkillMatch = project.sub_tasks?.some((task) =>
          task.skill_requirements?.some((taskSkill) => {
            const taskSkillName = typeof taskSkill === "string" ? taskSkill : taskSkill.skill;
            return userSkills.some((userSkill) => {
              const userSkillName = typeof userSkill === "string" ? userSkill : userSkill.skill;
              return userSkillName.toLowerCase() === taskSkillName.toLowerCase();
            });
          })
        );
        
        if (!hasSkillMatch) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "skill_match") {
        const matchA = a.skill_match || 0;
        const matchB = b.skill_match || 0;
        return sortOrder === "desc" ? matchB - matchA : matchA - matchB;
      }
      
      if (sortBy === "equity") {
        const equityA = a.equity_amount || 0;
        const equityB = b.equity_amount || 0;
        return sortOrder === "desc" ? equityB - equityA : equityA - equityB;
      }
      
      if (sortBy === "date") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
      
      return 0;
    });

  const handleApply = async (projectId: string, message: string, cvUrl: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to apply");
        return;
      }
      
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        toast.error("Project not found");
        return;
      }
      
      // Get the first subtask to apply for
      const task = project.sub_tasks?.[0];
      if (!task) {
        toast.error("No tasks found for this project");
        return;
      }
      
      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          task_id: task.task_id,
          project_id: project.project_id,
          status: 'pending',
          message: message,
          cv_url: cvUrl,
          applied_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Application submitted successfully");
      setIsApplyDialogOpen(false);
      
      // Redirect to applications tab
      navigate('/seeker/dashboard?tab=applications');
      
    } catch (error) {
      console.error("Error applying to project:", error);
      toast.error("Failed to submit application");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const resetFilters = () => {
    setFilters({
      timeframe: "",
      minEquity: "",
      maxEquity: "",
      skillMatch: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title, company, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skill_match">Skill Match</SelectItem>
              <SelectItem value="equity">Equity Amount</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filters</span>
          </Button>
        </div>
      </div>
      
      {isFiltersOpen && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select 
                  value={filters.timeframe} 
                  onValueChange={(value) => setFilters({...filters, timeframe: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any timeframe</SelectItem>
                    <SelectItem value="< 3 months">&lt; 3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="> 6 months">&gt; 6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Equity Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min %"
                    value={filters.minEquity}
                    onChange={(e) => setFilters({...filters, minEquity: e.target.value})}
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max %"
                    value={filters.maxEquity}
                    onChange={(e) => setFilters({...filters, maxEquity: e.target.value})}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skill-match" 
                    checked={filters.skillMatch}
                    onCheckedChange={(checked) => 
                      setFilters({...filters, skillMatch: checked === true})
                    }
                  />
                  <Label htmlFor="skill-match">Show only skill matches</Label>
                </div>
                
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {filteredProjects.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find more opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              userSkills={userSkills}
              onApply={() => {
                setSelectedProject(project);
                setIsApplyDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}
      
      {selectedProject && (
        <ApplyToProjectDialog
          open={isApplyDialogOpen}
          onOpenChange={setIsApplyDialogOpen}
          project={selectedProject}
          onApply={handleApply}
        />
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: EquityProject;
  userSkills: Skill[];
  onApply: () => void;
}

const ProjectCard = ({ project, userSkills, onApply }: ProjectCardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const getMatchedSkills = () => {
    const projectSkills = project.sub_tasks?.flatMap(task => 
      task.skill_requirements?.map(skill => 
        typeof skill === "string" ? skill.toLowerCase() : skill.skill.toLowerCase()
      ) || []
    ) || [];
    
    const userSkillNames = userSkills.map(skill => 
      typeof skill === "string" ? skill.toLowerCase() : skill.skill.toLowerCase()
    );
    
    return projectSkills.filter(skill => userSkillNames.includes(skill));
  };
  
  const matchedSkills = getMatchedSkills();
  const matchPercentage = project.skill_match || 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <CardTitle className="text-xl">{project.title}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {project.company_name || "Unknown Company"}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <div className="text-right">
              <div className="text-sm font-medium">Equity</div>
              <div className="text-lg font-bold">{project.equity_amount}%</div>
            </div>
            
            <Button onClick={onApply}>Apply Now</Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills & Requirements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Timeframe</div>
                  <div className="text-sm font-medium">{project.time_allocated || "Not specified"}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Project Type</div>
                  <div className="text-sm font-medium">Equity Project</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Posted</div>
                  <div className="text-sm font-medium">
                    {project.created_at 
                      ? new Date(project.created_at).toLocaleDateString() 
                      : "Unknown date"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Project Description</h4>
                <p className="text-sm text-muted-foreground">
                  {project.sub_tasks?.[0]?.description || "No description provided."}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Skill Match</h4>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${matchPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{matchPercentage}%</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="pt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {project.sub_tasks?.flatMap((task, taskIndex) => 
                    task.skill_requirements?.map((skill, skillIndex) => {
                      const skillName = typeof skill === "string" ? skill : skill.skill;
                      const isMatched = matchedSkills.includes(skillName.toLowerCase());
                      
                      return (
                        <Badge 
                          key={`${taskIndex}-${skillIndex}`}
                          variant={isMatched ? "default" : "outline"}
                        >
                          {skillName}
                          {typeof skill !== "string" && skill.level && (
                            <span className="ml-1 opacity-70">({skill.level})</span>
                          )}
                        </Badge>
                      );
                    })
                  ) || (
                    <span className="text-sm text-muted-foreground">No specific skills required</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Your Matching Skills</h4>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You don't have any matching skills for this project.
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Additional Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {project.time_allocated && (
                    <span className="block">• Time commitment: {project.time_allocated}</span>
                  )}
                  <span className="block">• Equity allocation: {project.equity_amount}%</span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
