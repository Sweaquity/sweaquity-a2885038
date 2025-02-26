
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";

interface Business {
  company_name: string;
  project_stage: string;
  contact_email: string;
  industry: string;
  website: string;
  location: string;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  business_id: string;
  tasks: any[];
  business: Business;
}

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [hasUploadedCV, setHasUploadedCV] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            *,
            business:business_id (
              company_name,
              project_stage,
              contact_email,
              industry,
              website,
              location
            )
          `)
          .eq('id', id)
          .single();

        if (projectError) throw projectError;

        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('project_id', id);

        if (tasksError) throw tasksError;

        // Check if user has uploaded CV
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: cvData } = await supabase
            .from('cv_parsed_data')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          
          setHasUploadedCV(!!cvData);
        }

        setProject({ ...projectData, tasks: tasksData });
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleApply = async () => {
    if (!hasUploadedCV) {
      toast.error("Please upload your CV before applying");
      return;
    }

    // TODO: Implement application submission logic
    toast.success("Application submitted successfully");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="text-muted-foreground">{project.business.company_name}</p>
            </div>
            <Badge variant="outline">{project.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="roles">Available Roles</TabsTrigger>
              <TabsTrigger value="apply">Apply</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Business Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Industry</dt>
                        <dd>{project.business.industry}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Project Stage</dt>
                        <dd>{project.business.project_stage}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Location</dt>
                        <dd>{project.business.location}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Website</dt>
                        <dd>
                          <a href={project.business.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {project.business.website}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Project Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Description</dt>
                        <dd>{project.description}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Timeframe</dt>
                        <dd>{project.project_timeframe}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Total Equity Available</dt>
                        <dd>{project.equity_allocation}%</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Required Skills</dt>
                        <dd className="flex flex-wrap gap-1 mt-1">
                          {project.skills_required.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <ActiveRolesTable project={project} />
            </TabsContent>

            <TabsContent value="apply">
              <div className="space-y-4">
                {!hasUploadedCV && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <p className="text-yellow-800">
                      Please upload your CV before applying. Your CV helps us match you with the right opportunities.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="font-medium">Application Message</label>
                  <Textarea
                    placeholder="Tell us about your relevant skills and experience..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button onClick={handleApply} disabled={!hasUploadedCV}>
                  Submit Application
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
