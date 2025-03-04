
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export default function IndexPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // Query business projects and join with the businesses table
        const { data: projectsData, error } = await supabase
          .from('business_projects')
          .select(`
            *,
            businesses (
              company_name
            )
          `)
          .eq('status', 'active')
          .limit(6);

        if (error) {
          console.error("Error fetching projects:", error);
          return;
        }

        setProjects(projectsData || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-20 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Find Equity Projects That Match Your Skills
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Join projects, contribute your skills, and earn equity in exciting startups and businesses.
              </p>
            </div>
            <div className="space-x-4">
              <Link to="/auth/seeker">
                <Button size="lg">Find Projects</Button>
              </Link>
              <Link to="/auth/business">
                <Button variant="outline" size="lg">List Your Project</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-12 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Featured Projects</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-lg">
              Discover exciting equity projects looking for your skills
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-[320px] animate-pulse">
                  <div className="h-full bg-gray-200 rounded-lg"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.project_id} className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                    <CardDescription>
                      {project.businesses?.company_name || "Company"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills_required && project.skills_required.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {project.equity_allocation}% Equity
                      </span>
                      <Link to={`/auth/seeker`}>
                        <Button variant="outline" size="sm">
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {projects.length === 0 && !isLoading && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-lg text-gray-500">No projects available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-lg">
              Simple steps to start earning equity with your skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Create Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Sign up and create your profile with your skills and experience.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2. Apply to Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Browse and apply to projects that match your skills and interests.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3. Earn Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Work on projects, track your contributions, and earn equity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-lg">
                Join our platform today and start your journey toward equity ownership.
              </p>
            </div>
            <div className="space-x-4">
              <Link to="/auth/seeker">
                <Button size="lg" variant="secondary">Sign Up as Job Seeker</Button>
              </Link>
              <Link to="/auth/business">
                <Button size="lg" variant="outline" className="bg-transparent">Sign Up as Business</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
