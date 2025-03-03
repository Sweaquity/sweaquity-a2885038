
import { Card } from "@/components/ui/card";
import { Building2, User, Briefcase, BarChart2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface FeaturedProject {
  project_id: string;
  title: string;
  description: string;
  equity_allocation: number;
  skills_required: string[];
  sub_tasks: {
    task_id: string;
    title: string;
    description: string;
    equity_allocation: number;
    skill_requirements: any[];
  }[];
  company_name?: string;
  businesses?: {
    company_name?: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            project_id,
            title,
            description,
            equity_allocation,
            skills_required,
            businesses(company_name),
            project_sub_tasks:project_sub_tasks(
              task_id,
              title,
              description,
              equity_allocation,
              skill_requirements
            )
          `)
          .eq('status', 'active')
          .limit(4);

        if (error) throw error;

        // Process the data to match our interface
        const processedData: FeaturedProject[] = data.map(project => {
          // Get the company name
          let companyName = "Unknown Company";
          if (project.businesses) {
            if (Array.isArray(project.businesses)) {
              companyName = project.businesses[0]?.company_name || "Unknown Company";
            } else {
              companyName = project.businesses.company_name || "Unknown Company";
            }
          }

          return {
            project_id: project.project_id,
            title: project.title,
            description: project.description,
            equity_allocation: project.equity_allocation,
            skills_required: project.skills_required || [],
            company_name: companyName,
            sub_tasks: (project.project_sub_tasks || []).map((task: any) => ({
              task_id: task.task_id,
              title: task.title,
              description: task.description,
              equity_allocation: task.equity_allocation,
              skill_requirements: task.skill_requirements || []
            }))
          };
        });

        setFeaturedProjects(processedData);
      } catch (error) {
        console.error("Error fetching featured projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  const userTypes = [
    {
      title: "Job Seeker",
      description: "Find your next opportunity and showcase your skills",
      icon: User,
      type: "seeker" as const,
      path: "/auth/seeker"
    },
    {
      title: "Business",
      description: "Post jobs and find the perfect candidates",
      icon: Building2,
      type: "business" as const,
      path: "/auth/business"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-6 page-transition">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Sweaquity
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          The platform where skills meet equity - build your future by contributing to exciting projects
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        {userTypes.map((type) => (
          <Card
            key={type.type}
            className="p-6 landing-card hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(type.path)}
          >
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-4 p-3 rounded-full bg-accent/10 text-accent">
                <type.icon size={24} />
              </div>
              <h2 className="text-xl font-semibold mb-2">{type.title}</h2>
              <p className="text-sm text-muted-foreground">
                {type.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="w-full max-w-6xl mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Featured Equity Projects</h2>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 h-64 animate-pulse bg-muted/50"></Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.project_id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.company_name}</p>
                  </div>
                  
                  <p className="text-sm mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {project.equity_allocation}% Equity Available
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.skills_required?.slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {project.skills_required?.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{project.skills_required.length - 4} more</span>
                      )}
                    </div>
                  </div>
                  
                  {project.sub_tasks?.[0] && (
                    <div className="bg-muted/20 p-3 rounded-md mt-auto">
                      <h4 className="text-sm font-medium mb-1">{project.sub_tasks[0].title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.sub_tasks[0].description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium text-green-600">
                          {project.sub_tasks[0].equity_allocation}% Equity
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/projects/${project.project_id}`}>View Project</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link to="/auth/seeker">Explore All Projects</Link>
          </Button>
        </div>
      </div>
      
      <Button asChild variant="link" className="text-muted-foreground">
        <Link to="/auth/recruiter">Recruitment login here</Link>
      </Button>
    </div>
  );
};

export default Index;
