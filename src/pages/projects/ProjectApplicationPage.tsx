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
  status: string;
  skill_requirements: any[];
  task_status: string;
  completion_percentage: number;
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view this page");
          return;
        }

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

        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('project_id', id);

        if (taskError) throw taskError;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Select</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Equity</th>
                      <th className="px-4 py-2 text-left">Timeframe</th>
                      <th className="px-4 py-2 text-left">Skills Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subTasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <input
                            type="radio"
                            name="taskSelection"
                            value={task.id}
                            checked={selectedTaskId === task.id}
                            onChange={() => setSelectedTaskId(task.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2">{task.equity_allocation}%</td>
                        <td className="px-4 py-2">{task.timeframe}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {task.skills_required?.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            taskId={selectedTaskId || undefined}
            hasStoredCV={hasStoredCV}
            storedCVUrl={storedCVUrl}
            onApplicationSubmitted={() => {
              toast.success("Application submitted successfully");
              navigate("/seeker/dashboard");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
