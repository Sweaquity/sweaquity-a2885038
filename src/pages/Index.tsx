
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

interface FeaturedProject {
  project_id: string;
  title: string;
  description: string;
  equity_allocation: number;
  skills_required: string[];
  company_name?: string;
  businesses?: {
    company_name: string;
  };
  sub_tasks?: {
    task_id: string;
    title: string;
    description: string;
    equity_allocation: number;
    skill_requirements: any[];
  }[];
}

const Index = () => {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            project_id,
            title,
            description,
            equity_allocation,
            skills_required,
            businesses (
              company_name
            ),
            project_sub_tasks (
              task_id,
              title,
              description,
              equity_allocation,
              skill_requirements
            )
          `)
          .eq('status', 'active')
          .limit(3);

        if (error) throw error;

        // Transform data to match FeaturedProject interface
        const projects: FeaturedProject[] = data.map(project => ({
          project_id: project.project_id,
          title: project.title,
          description: project.description,
          equity_allocation: project.equity_allocation,
          skills_required: project.skills_required || [],
          company_name: project.businesses?.company_name,
          sub_tasks: project.project_sub_tasks || []
        }));

        setFeaturedProjects(projects);
      } catch (error) {
        console.error("Error fetching featured projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Equity Opportunities in Exciting Projects
            </h1>
            <p className="text-xl mb-8">
              Connect with businesses looking for your skills and earn equity in innovative projects.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link to="/seeker/register">Join as Job Seeker</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/business/register">Post a Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Equity Projects</h2>
            <Button asChild variant="ghost" className="gap-1">
              <Link to="/seeker/login">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-muted rounded-md mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded-md w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 bg-muted rounded-md mb-4"></div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="h-6 w-16 bg-muted rounded-full"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map(project => (
                <Card key={project.project_id} className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.company_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="line-clamp-3 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skills_required.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                      {project.skills_required.length > 3 && (
                        <Badge variant="outline">+{project.skills_required.length - 3} more</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      Up to {project.equity_allocation}% equity available
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/seeker/login">Apply Now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {featuredProjects.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No featured projects available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">For Job Seekers</h2>
            <p className="mb-6 text-muted-foreground">
              Find exciting projects that match your skills and earn equity instead of just a salary.
              Build your portfolio while becoming a part-owner in innovative businesses.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex gap-2">
                <Badge className="h-6">1</Badge>
                <span>Upload your CV and showcase your skills</span>
              </li>
              <li className="flex gap-2">
                <Badge className="h-6">2</Badge>
                <span>Get matched with projects seeking your expertise</span>
              </li>
              <li className="flex gap-2">
                <Badge className="h-6">3</Badge>
                <span>Negotiate equity and join exciting ventures</span>
              </li>
            </ul>
            <Button asChild>
              <Link to="/seeker/register">Sign Up as Job Seeker</Link>
            </Button>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">For Businesses</h2>
            <p className="mb-6 text-muted-foreground">
              Find talented professionals willing to work for equity in your venture.
              Break down your project into tasks and allocate equity for each contribution.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex gap-2">
                <Badge className="h-6">1</Badge>
                <span>Post your project and define required skills</span>
              </li>
              <li className="flex gap-2">
                <Badge className="h-6">2</Badge>
                <span>Review applications from skilled professionals</span>
              </li>
              <li className="flex gap-2">
                <Badge className="h-6">3</Badge>
                <span>Collaborate with equity partners to grow your business</span>
              </li>
            </ul>
            <Button asChild>
              <Link to="/business/register">Post Your Project</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold">SweaQuity</h2>
              <p className="text-muted-foreground">Connect talent with equity opportunities</p>
            </div>
            <div className="flex gap-8">
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SweaQuity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
