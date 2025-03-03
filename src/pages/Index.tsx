
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface FeaturedProject {
  project_id: string;
  title: string;
  description: string;
  equity_allocation?: number;
  skills_required?: string[];
  project_timeframe?: string;
  business?: {
    company_name: string;
  };
}

export default function IndexPage() {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            project_id,
            title,
            description,
            equity_allocation,
            skills_required,
            project_timeframe,
            business:businesses (
              company_name
            )
          `)
          .eq('status', 'active')
          .limit(3);

        if (error) throw error;
        
        // Fixed: Transform the data to match the FeaturedProject interface
        const transformedData: FeaturedProject[] = data?.map(project => ({
          project_id: project.project_id,
          title: project.title,
          description: project.description,
          equity_allocation: project.equity_allocation,
          skills_required: project.skills_required,
          project_timeframe: project.project_timeframe,
          // Handle nested business data correctly
          business: project.business && Array.isArray(project.business) && project.business.length > 0 
            ? { company_name: project.business[0].company_name }
            : { company_name: "Anonymous Company" }
        })) || [];
        
        setFeaturedProjects(transformedData);
      } catch (error) {
        console.error('Error fetching featured projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background border-b py-6">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sweaquity</h1>
          <div className="space-x-4">
            <Button asChild variant="ghost">
              <Link to="/business/login">Business Login</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/seeker/login">Job Seeker Login</Link>
            </Button>
            <Button asChild>
              <Link to="/seeker/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 md:py-24 bg-muted/50">
          <div className="container text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Connect with Equity Projects
            </h1>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed mx-auto max-w-[700px]">
              Use your skills to earn equity in exciting projects. Find the perfect project and build your portfolio.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link to="/seeker/register">Find Projects</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/business/register">Post a Project</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Featured Projects</h2>
            {loading ? (
              <div className="text-center py-12">Loading featured projects...</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <Card key={project.project_id}>
                    <CardHeader>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>
                        {project.business?.company_name || "Anonymous Company"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills_required?.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline">{skill}</Badge>
                        ))}
                        {project.skills_required && project.skills_required.length > 3 && (
                          <Badge variant="outline">+{project.skills_required.length - 3} more</Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        {project.equity_allocation && (
                          <p><span className="font-medium">Equity:</span> {project.equity_allocation}%</p>
                        )}
                        {project.project_timeframe && (
                          <p><span className="font-medium">Timeframe:</span> {project.project_timeframe}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/projects/${project.project_id}`}>View Project</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                {featuredProjects.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-muted-foreground">
                    No featured projects available at the moment.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-24 bg-muted/50">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose Sweaquity?</h2>
                <ul className="space-y-4">
                  <li className="flex gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <div>
                      <h3 className="font-medium">Earn Equity</h3>
                      <p className="text-muted-foreground">
                        Use your skills to earn a stake in promising projects.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <div>
                      <h3 className="font-medium">Find Talent</h3>
                      <p className="text-muted-foreground">
                        Connect with skilled professionals who believe in your project.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <div>
                      <h3 className="font-medium">Secure Agreements</h3>
                      <p className="text-muted-foreground">
                        All equity agreements are formalized and secure.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-12 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-4">Ready to get started?</h3>
                <p className="mb-6">
                  Whether you're looking for opportunities or seeking talent, Sweaquity is the platform for you.
                </p>
                <div className="space-x-2">
                  <Button asChild variant="secondary">
                    <Link to="/seeker/register">Find Projects</Link>
                  </Button>
                  <Button asChild variant="outline" className="text-white hover:text-black border-white">
                    <Link to="/business/register">Post a Project</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center md:text-left text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sweaquity. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link to="/" className="text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link to="/" className="text-muted-foreground hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
