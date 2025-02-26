import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectDetails } from "@/components/projects/ProjectDetails";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { SubTask } from "@/types/jobSeeker";

interface Business {
  id?: string;
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
  tasks: SubTask[];
  business: Business;
}

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isJobSeeker, setIsJobSeeker] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view project details");
          return;
        }

        // Check if user is a job seeker
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        setIsJobSeeker(!!profileData);

        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            id,
            title,
            description,
            status,
            equity_allocation,
            skills_required,
            project_timeframe,
            business_id,
            business:businesses!business_projects_business_id_fkey (
              id,
              company_name,
              project_stage,
              contact_email,
              industry,
              website,
              location
            ),
            tasks:project_sub_tasks (
              id,
              title,
              description,
              status,
              equity_allocation,
              skills_required,
              timeframe,
              skill_requirements,
              task_status,
              completion_percentage
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (projectError) {
          console.error('Project error:', projectError);
          throw projectError;
        }
        
        if (!projectData) {
          console.error('No project data found for ID:', id);
          toast.error("Project not found");
          return;
        }

        console.log('Project data:', projectData);

        // Check if user has already applied
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('*')
          .eq('project_id', id)
          .eq('user_id', session.user.id)
          .maybeSingle();

        setHasApplied(!!applicationData);

        // Check for stored CV
        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('cv_url')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (cvData?.cv_url) {
          setHasStoredCV(true);
          setStoredCVUrl(cvData.cv_url);
        }

        // Handle the business data
        const defaultBusiness: Business = {
          company_name: "Project Owner",
          project_stage: "",
          contact_email: "",
          industry: "",
          website: "",
          location: ""
        };

        // Extract business data, ensuring it's a single object
        const businessData = Array.isArray(projectData.business) 
          ? projectData.business[0] || defaultBusiness
          : projectData.business || defaultBusiness;

        // Map task data to match SubTask interface
        const mappedTasks: SubTask[] = (projectData.tasks || []).map(task => ({
          id: task.id,
          project_id: task.project_id || projectData.id,
          title: task.title,
          description: task.description,
          status: task.status,
          equity_allocation: task.equity_allocation,
          skills_required: task.skills_required || [],
          timeframe: task.timeframe,
          skill_requirements: task.skill_requirements || [],
          task_status: task.task_status || 'pending',
          completion_percentage: task.completion_percentage || 0
        }));

        setProject({
          id: projectData.id,
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          equity_allocation: projectData.equity_allocation,
          skills_required: projectData.skills_required || [],
          project_timeframe: projectData.project_timeframe,
          business_id: projectData.business_id,
          tasks: mappedTasks,
          business: businessData
        });
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
          <ProjectHeader
            title={project.title}
            companyName={project.business.company_name}
            status={project.status}
          />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="roles">Available Roles</TabsTrigger>
              {isJobSeeker && <TabsTrigger value="apply">Apply</TabsTrigger>}
            </TabsList>

            <TabsContent value="details">
              <ProjectDetails
                description={project.description}
                timeframe={project.project_timeframe}
                equityAllocation={project.equity_allocation}
                skillsRequired={project.skills_required}
              />
            </TabsContent>

            <TabsContent value="roles">
              <ActiveRolesTable project={project} />
            </TabsContent>

            {isJobSeeker && (
              <TabsContent value="apply">
                {hasApplied ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800">
                      You have already applied for this opportunity. We'll notify you of any updates.
                    </p>
                  </div>
                ) : (
                  <ApplicationForm
                    projectId={id || ''}
                    hasStoredCV={hasStoredCV}
                    storedCVUrl={storedCVUrl}
                    onApplicationSubmitted={() => setHasApplied(true)}
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
