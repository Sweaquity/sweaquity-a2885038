
import { Card } from "@/components/ui/card";
import { Building2, User, Briefcase, BarChart2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { RegistrationProcess } from "@/components/landing/RegistrationProcess";
import { ContractProcessExplanation } from "@/components/landing/ContractProcessExplanation";

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
  console.log("Rendering Index component");
  const navigate = useNavigate();
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Index component mounted");
    const fetchFeaturedProjects = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching featured projects...");
        const { data, error } = await supabase
          .from("business_projects")
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
          .eq("status", "active")
          .limit(4);

        if (error) {
          console.error("Error fetching projects:", error);
          throw error;
        }

        console.log("Projects data received:", data);
        
        const processedData: FeaturedProject[] = data.map((project) => {
          let companyName = "Unknown Company";
          if (project.businesses) {
            if (Array.isArray(project.businesses)) {
              companyName = project.businesses[0]?.company_name || "Unknown Company";
            } else if (project.businesses && typeof project.businesses === "object") {
              companyName = (project.businesses as any).company_name || "Unknown Company";
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
              skill_requirements: task.skill_requirements || [],
            })),
          };
        });

        console.log("Processed projects:", processedData);
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
      path: "/auth/seeker",
    },
    {
      title: "Business",
      description: "Post jobs and find the perfect candidates",
      icon: Building2,
      type: "business" as const,
      path: "/auth/business",
    },
  ];

  return (
    <div>
      <header className="bg-gradient-to-r from-primary/20 to-primary/10 py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Exchange <span className="text-primary">Skills</span> for <span className="text-primary">Equity</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connect job seekers with businesses looking to offer equity in exchange for skills and experience.
             <br /> 
             <br /> Let's start by registering or logging in.
          </p>
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-12">
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
        </div>
      </header>

      <section className="py-16 bg-slate-50/50">
        <div className="container">
          <RegistrationProcess />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <ContractProcessExplanation />
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto text-center mb-8">
        <h2 className="text-2xl font-semibold mb-6">Featured Equity Projects</h2>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 h-64 animate-pulse bg-muted/50"></Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 justify-center">
            {featuredProjects.map((project) => (
              <Card key={project.project_id} className="p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.company_name}</p>
                <p className="text-sm mb-4 line-clamp-2">{project.description}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
