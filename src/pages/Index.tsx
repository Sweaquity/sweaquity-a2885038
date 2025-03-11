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
  const navigate = useNavigate();
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setIsLoading(true);
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

        if (error) throw error;

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

        setFeaturedProjects(processedData);
      } catch (error) {
        console.error("Error fetching featured projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  return (
    <div>
      <header className="bg-gradient-to-r from-primary/20 to-primary/10 py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Exchange <span className="text-primary">Skills</span> for <span className="text-primary">Equity</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connect job seekers with businesses looking to offer equity in exchange for skills and experience.
            Let's start by registering or logging in.
          </p>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Link to="/auth/seeker">
            <Button size="lg" className="w-full sm:w-auto">Find Projects</Button>
          </Link>
          <Link to="/auth/business">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Post Projects</Button>
          </Link>
        </div>
      </div>

      <Button asChild variant="link" className="text-muted-foreground">
        <Link to="/auth/recruiter">Recruitment login here</Link>
      </Button>
    </div>
  );
};

export default Index;
