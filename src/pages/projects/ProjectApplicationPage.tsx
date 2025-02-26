
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Briefcase, Users2 } from "lucide-react";

interface BusinessDetails {
  company_name: string;
  created_at: string;
  business_type: string;
  industry: string;
  location: string;
  organization_type: string;
}

interface ProjectDetails {
  title: string;
  description: string;
  project_stage: string;
  equity_allocation: number;
  skills_required: string[];
  completion_percentage: number;
  equity_allocated: number;
  created_at: string;
}

interface SubTask {
  id: string;
  title: string;
  description: string;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
}

interface JobSeekerProfile {
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  employment_preference: string;
  created_at: string;
}

export const ProjectApplicationPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view this page");
          return;
        }

        // Fetch project and business details
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            *,
            businesses (
              company_name,
              created_at,
              business_type,
              industry,
              location,
              organization_type
            )
          `)
          .eq('id', id)
          .single();

        if (projectError) throw projectError;

        // Fetch sub-tasks
        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('project_id', id);

        if (taskError) throw taskError;

        // Fetch job seeker profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Check for stored CV
        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('cv_url')
          .eq('user_id', session.user.id)
          .single();

        setBusinessDetails(projectData.businesses);
        setProjectDetails(projectData);
        setSubTasks(taskData);
        setJobSeekerProfile(profileData);
        setHasStoredCV(!!cvData?.cv_url);
        setStoredCVUrl(cvData?.cv_url || null);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!businessDetails || !projectDetails) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Business Details */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{businessDetails.company_name}</h2>
            <Badge>{businessDetails.business_type}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>{businessDetails.industry}</span>
            <Separator orientation="vertical" className="h-4" />
            <MapPin className="w-4 h-4" />
            <span>{businessDetails.location}</span>
            <Separator orientation="vertical" className="h-4" />
            <Users2 className="w-4 h-4" />
            <span>{businessDetails.organization_type}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Project Details */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{projectDetails.title}</h3>
            <p className="text-muted-foreground">{projectDetails.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Project Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {format(new Date(projectDetails.created_at), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Stage: {projectDetails.project_stage}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Equity Details</h4>
              <div className="space-y-2">
                <div>Total Allocation: {projectDetails.equity_allocation}%</div>
                <div>Allocated: {projectDetails.equity_allocated}%</div>
                <div>Project Completion: {projectDetails.completion_percentage}%</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {projectDetails.skills_required?.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>

          {subTasks.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Available Tasks</h4>
              <div className="space-y-4">
                {subTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <h5 className="font-medium">{task.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div>Equity: {task.equity_allocation}%</div>
                      <div>Timeframe: {task.timeframe}</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Required Skills:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.skills_required?.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Submit Application</h3>
        </CardHeader>
        <CardContent>
          {jobSeekerProfile && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Your Profile Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  {jobSeekerProfile.first_name} {jobSeekerProfile.last_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Title: </span>
                  {jobSeekerProfile.title}
                </div>
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  {jobSeekerProfile.location}
                </div>
                <div>
                  <span className="text-muted-foreground">Employment Preference: </span>
                  {jobSeekerProfile.employment_preference}
                </div>
              </div>
            </div>
          )}
          <ApplicationForm
            projectId={id || ''}
            hasStoredCV={hasStoredCV}
            storedCVUrl={storedCVUrl}
            onApplicationSubmitted={() => {
              toast.success("Application submitted successfully");
              // Optionally redirect to applications list
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
