
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  Filter,
  ArrowUpDown,
  BarChart3,
  Clock
} from "lucide-react";
import { EquityProject } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: any[];
  userSkills: any[];
}

export const OpportunitiesTab = ({ projects = [], userSkills = [] }: OpportunitiesTabProps) => {
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, skillFilter, timeFilter, sortBy, activeTab]);

  const filterProjects = () => {
    let filtered = [...projects];

    // Search by title, business name, or description
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        return (
          (project.title && project.title.toLowerCase().includes(lowercaseTerm)) ||
          (project.business_roles?.company_name && project.business_roles.company_name.toLowerCase().includes(lowercaseTerm)) ||
          (project.business_roles?.description && project.business_roles.description.toLowerCase().includes(lowercaseTerm))
        );
      });
    }

    // Apply skill filter
    if (skillFilter !== "all") {
      filtered = filtered.filter(project => {
        const projectSkills = project.business_roles?.skill_requirements || [];
        return projectSkills.some((skill: any) => 
          typeof skill === 'string' 
            ? skill.toLowerCase() === skillFilter.toLowerCase()
            : skill.skill.toLowerCase() === skillFilter.toLowerCase()
        );
      });
    }

    // Apply time filter
    if (timeFilter !== "all") {
      filtered = filtered.filter(project => {
        const timeframe = project.business_roles?.timeframe || "";
        if (timeFilter === "short") return timeframe.includes("1-3 months") || timeframe.includes("Less than 1 month");
        if (timeFilter === "medium") return timeframe.includes("3-6 months");
        if (timeFilter === "long") return timeframe.includes("6-12 months") || timeframe.includes("Over 12 months");
        return true;
      });
    }

    // Sort results
    if (sortBy === "relevance") {
      filtered.sort((a, b) => (b.skill_match || 0) - (a.skill_match || 0));
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.created_by ? new Date(0).getTime() : new Date(0).getTime();
        const dateB = b.created_by ? new Date(0).getTime() : new Date(0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "equity") {
      filtered.sort((a, b) => (b.business_roles?.equity_allocation || 0) - (a.business_roles?.equity_allocation || 0));
    }

    setFilteredProjects(filtered);
  };

  const renderSkillMatch = (project: any) => {
    const match = project.skill_match || 0;
    let color = "bg-red-100 text-red-800";
    if (match >= 80) color = "bg-green-100 text-green-800";
    else if (match >= 50) color = "bg-yellow-100 text-yellow-800";
    
    return (
      <Badge className={color}>
        {match}% Match
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Discover Opportunities</h2>
        <p className="text-muted-foreground">Find equity projects that match your skills</p>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {userSkills.map((skill, idx) => (
                <SelectItem key={idx} value={skill.skill}>
                  {skill.skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time commitment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Duration</SelectItem>
              <SelectItem value="short">Short Term (< 3 months)</SelectItem>
              <SelectItem value="medium">Medium Term (3-6 months)</SelectItem>
              <SelectItem value="long">Long Term (6+ months)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Skill Match</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="equity">Highest Equity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="available">Available Projects</TabsTrigger>
          <TabsTrigger value="recommended">Recommended for You</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-semibold text-lg">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {project.title || project.business_roles?.project_title || "Untitled Project"}
                      </CardTitle>
                      {renderSkillMatch(project)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {project.business_roles?.company_name || "Unknown Company"}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    <div>
                      <p className="text-sm line-clamp-3 min-h-[3rem]">
                        {project.business_roles?.description || "No description available."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.business_roles?.skill_requirements?.slice(0, 3).map((skill: any, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {typeof skill === 'string' ? skill : skill.skill}
                        </Badge>
                      ))}
                      {(project.business_roles?.skill_requirements?.length || 0) > 3 && (
                        <Badge variant="outline">+{(project.business_roles?.skill_requirements?.length || 0) - 3} more</Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant="secondary">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {project.business_roles?.equity_allocation || 0}% Equity
                      </Badge>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended">
          <div className="text-center py-8">
            <h3 className="font-semibold text-lg">Recommended Projects</h3>
            <p className="text-muted-foreground">Based on your skills and experience</p>
            {/* Recommended projects content */}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="text-center py-8">
            <h3 className="font-semibold text-lg">Trending Projects</h3>
            <p className="text-muted-foreground">Popular in the community</p>
            {/* Trending projects content */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
