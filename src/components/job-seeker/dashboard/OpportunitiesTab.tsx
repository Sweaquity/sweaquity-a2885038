
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { calculateSkillMatch, rankProjectsByRelevance } from "@/utils/skillMatching";
import { EquityProject, Skill } from "@/types/jobSeeker";
import { FilterSection } from "./opportunities/FilterSection";
import { ProjectCard } from "./opportunities/ProjectCard";
import { TaskCard } from "./opportunities/TaskCard";
import { EmptyState } from "./opportunities/EmptyState";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Project {
  id: string;
  title: string;
  description?: string;
  skills_required?: string[];
  project_timeframe?: string;
  equity_allocation?: number;
  company_name?: string;
  created_by?: string;
  business_id?: string;
  skill_match?: number;
}

export interface Task {
  id: string;
  task_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  skill_requirements?: Skill[];
  equity_allocation: number;
  timeframe: string;
  skill_match?: number;
  company_name?: string;
  task_status?: string;
  completion_percentage?: number;
}

interface OpportunitiesTabProps {
  projects: Project[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects = [], userSkills = [] }: OpportunitiesTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("projects");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    equity: { min: 0, max: 100 },
    timeframe: "all",
    minSkillMatch: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("business_projects")
          .select(`
            project_id,
            title,
            description,
            skills_required,
            project_timeframe,
            equity_allocation,
            created_by,
            businesses (
              company_name,
              businesses_id
            )
          `)
          .eq("status", "active");

        if (projectsError) throw projectsError;

        // Fetch subtasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("project_sub_tasks")
          .select(`
            task_id,
            project_id,
            title,
            description,
            skill_requirements,
            timeframe,
            status,
            equity_allocation,
            task_status,
            completion_percentage,
            business_projects (
              businesses (
                company_name
              )
            )
          `)
          .eq("status", "open");

        if (tasksError) throw tasksError;

        // Format projects
        const formattedProjects = projectsData.map((project) => ({
          id: project.project_id,
          title: project.title,
          description: project.description,
          skills_required: project.skills_required,
          project_timeframe: project.project_timeframe,
          equity_allocation: project.equity_allocation,
          company_name: project.businesses?.company_name,
          created_by: project.created_by,
          business_id: project.businesses?.businesses_id
        }));

        // Format tasks
        const formattedTasks = tasksData.map((task) => ({
          id: task.task_id,
          task_id: task.task_id,
          project_id: task.project_id,
          title: task.title,
          description: task.description,
          skill_requirements: task.skill_requirements,
          equity_allocation: task.equity_allocation,
          timeframe: task.timeframe,
          status: task.status,
          task_status: task.task_status,
          completion_percentage: task.completion_percentage,
          company_name: task.business_projects?.businesses?.company_name
        }));

        // Apply skill matching
        const projectsWithMatches = formattedProjects.map(project => {
          const skillMatch = calculateSkillMatch(userSkills, project.skills_required || []);
          return {
            ...project,
            skill_match: skillMatch
          };
        });

        const tasksWithMatches = formattedTasks.map(task => {
          const skillMatch = calculateSkillMatch(userSkills, task.skill_requirements || []);
          return {
            ...task,
            skill_match: skillMatch
          };
        });

        // Collect all unique skills for filtering
        const uniqueSkills = new Set<string>();
        
        projectsData.forEach(project => {
          if (Array.isArray(project.skills_required)) {
            project.skills_required.forEach(skill => {
              if (typeof skill === 'string') {
                uniqueSkills.add(skill);
              } else if (skill && typeof skill === 'object' && 'skill' in skill) {
                uniqueSkills.add(skill.skill);
              }
            });
          }
        });
        
        tasksData.forEach(task => {
          if (Array.isArray(task.skill_requirements)) {
            task.skill_requirements.forEach(skill => {
              if (typeof skill === 'string') {
                uniqueSkills.add(skill);
              } else if (skill && typeof skill === 'object' && 'skill' in skill) {
                uniqueSkills.add(skill.skill);
              }
            });
          }
        });

        setAllSkills(Array.from(uniqueSkills));
        setAllProjects(projectsWithMatches);
        setAllTasks(tasksWithMatches);
        setFilteredProjects(projectsWithMatches);
        setFilteredTasks(tasksWithMatches);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userSkills]);

  useEffect(() => {
    // Filter projects based on search term and filters
    const filterItems = () => {
      const searchTermLower = searchTerm.toLowerCase();

      // Filter projects
      const filteredProjs = allProjects.filter((project) => {
        // Search term filter
        const matchesSearch =
          !searchTerm ||
          project.title.toLowerCase().includes(searchTermLower) ||
          (project.description && project.description.toLowerCase().includes(searchTermLower)) ||
          (project.company_name && project.company_name.toLowerCase().includes(searchTermLower));

        // Equity filter
        const matchesEquity =
          project.equity_allocation !== undefined &&
          project.equity_allocation >= filters.equity.min &&
          project.equity_allocation <= filters.equity.max;

        // Timeframe filter
        const matchesTimeframe =
          filters.timeframe === "all" ||
          (project.project_timeframe && project.project_timeframe.toLowerCase().includes(filters.timeframe));

        // Skill match filter
        const matchesSkillThreshold =
          project.skill_match !== undefined && project.skill_match >= filters.minSkillMatch;

        return matchesSearch && matchesEquity && matchesTimeframe && matchesSkillThreshold;
      });

      // Filter tasks
      const filteredTsks = allTasks.filter((task) => {
        // Search term filter
        const matchesSearch =
          !searchTerm ||
          task.title.toLowerCase().includes(searchTermLower) ||
          (task.description && task.description.toLowerCase().includes(searchTermLower)) ||
          (task.company_name && task.company_name.toLowerCase().includes(searchTermLower));

        // Equity filter
        const matchesEquity =
          task.equity_allocation !== undefined &&
          task.equity_allocation >= filters.equity.min &&
          task.equity_allocation <= filters.equity.max;

        // Timeframe filter
        const matchesTimeframe =
          filters.timeframe === "all" ||
          (task.timeframe && task.timeframe.toLowerCase().includes(filters.timeframe));

        // Skill match filter
        const matchesSkillThreshold =
          task.skill_match !== undefined && task.skill_match >= filters.minSkillMatch;

        return matchesSearch && matchesEquity && matchesTimeframe && matchesSkillThreshold;
      });

      setFilteredProjects(filteredProjs);
      setFilteredTasks(filteredTsks);
    };

    filterItems();
  }, [searchTerm, filters, allProjects, allTasks]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div>
          <FilterSection
            allSkills={allSkills}
            searchTerm={searchTerm}
            filterSkill={null}
            onSearchChange={setSearchTerm}
            onFilterSkillChange={() => {}}
            newOpportunities={0}
          />
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects and tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="border-b w-full rounded-none justify-start mb-6">
              <TabsTrigger value="projects" className="relative">
                Projects
                {filteredProjects.length > 0 && (
                  <Badge className="ml-2 bg-primary text-white">{filteredProjects.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="relative">
                Tasks
                {filteredTasks.length > 0 && (
                  <Badge className="ml-2 bg-primary text-white">{filteredTasks.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-0">
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} userSkills={userSkills} />
                  ))}
                </div>
              ) : (
                <EmptyState searchTerm={searchTerm} />
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} userSkills={userSkills} />
                  ))}
                </div>
              ) : (
                <EmptyState searchTerm={searchTerm} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
