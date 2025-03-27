
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Clock, ExternalLink, Check, ArrowRight } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skill, EquityProject } from "@/types/jobSeeker";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState<EquityProject[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!projects) {
      setFilteredProjects([]);
      return;
    }

    let filtered = [...projects];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        const titleMatch = project.title?.toLowerCase().includes(term);
        const companyMatch = project.company_name?.toLowerCase().includes(term);
        const descriptionMatch = project.sub_tasks?.[0]?.description?.toLowerCase().includes(term);
        
        return titleMatch || companyMatch || descriptionMatch;
      });
    }

    // Filter by type
    if (filterType !== "all") {
      if (filterType === "high-match") {
        filtered = filtered.filter(project => (project.skill_match || 0) >= 70);
      } else if (filterType === "recent") {
        // Filter for projects created within the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        filtered = filtered.filter(project => {
          if (!project.updated_at) return false;
          const projectDate = new Date(project.updated_at);
          return projectDate > oneWeekAgo;
        });
      } else if (filterType === "short-term") {
        filtered = filtered.filter(project => {
          const timeframe = project.time_allocated?.toLowerCase() || 
                           project.sub_tasks?.[0]?.timeframe?.toLowerCase();
          return timeframe?.includes('short') || 
                 timeframe?.includes('week') || 
                 timeframe?.includes('&lt; 3 months');
        });
      }
    }

    // Sort by match percentage (highest first)
    filtered.sort((a, b) => (b.skill_match || 0) - (a.skill_match || 0));

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterType]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects({
      ...expandedProjects,
      [projectId]: !expandedProjects[projectId]
    });
  };

  const applyNow = (projectId: string) => {
    navigate(`/seeker/applications/new?project=${projectId}`);
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No opportunities available</h3>
            <p className="text-muted-foreground mt-2">
              Check back later for new equity projects
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="high-match">High Match (>70%)</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="short-term">Short Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleProjectExpand(project.id)}
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="space-y-1 mb-2 md:mb-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      <div className="ml-2 flex items-center">
                        {project.skill_match && project.skill_match >= 70 && (
                          <Badge className="bg-green-500">High Match</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.company_name || "Unknown Company"}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {project.updated_at ? getTimeAgo(project.updated_at) : "Date unknown"}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">Skill Match</div>
                      <div className="text-xl font-bold">
                        {project.skill_match || 0}%
                      </div>
                    </div>
                    
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        applyNow(project.id);
                      }}
                      className="whitespace-nowrap"
                    >
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {expandedProjects[project.id] && (
                <div className="px-4 pb-4 pt-0 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Project Description</h4>
                        <p className="text-sm text-gray-600">
                          {project.sub_tasks?.[0]?.description || "No description available."}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Timeframe</h4>
                        <p className="text-sm text-gray-600">
                          {project.time_allocated || project.sub_tasks?.[0]?.timeframe || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Equity Allocation</h4>
                        <p className="text-sm text-gray-600">
                          {project.equity_amount || project.sub_tasks?.[0]?.equity_allocation || 0}%
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Skills Required</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.sub_tasks?.[0]?.skill_requirements?.map((skill, index) => {
                            const skillName = typeof skill === 'string' ? skill : skill.skill;
                            const level = typeof skill === 'string' ? 'Intermediate' : skill.level;
                            
                            // Check if user has this skill
                            const userHasSkill = userSkills.some(
                              userSkill => userSkill.skill.toLowerCase() === skillName.toLowerCase()
                            );
                            
                            return (
                              <Badge 
                                key={index} 
                                variant={userHasSkill ? "default" : "outline"}
                                className={userHasSkill ? "bg-green-500" : ""}
                              >
                                {skillName}
                                {userHasSkill && <Check className="ml-1 h-3 w-3" />}
                              </Badge>
                            );
                          })}
                          
                          {(!project.sub_tasks?.[0]?.skill_requirements || 
                            project.sub_tasks[0].skill_requirements.length === 0) && (
                              <span className="text-sm text-gray-500">No specific skills required</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyNow(project.id)}
                        >
                          Apply for this project <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No matching projects found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
