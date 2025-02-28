
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { SubTask } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Business {
  id?: string;
  company_name: string;
  project_stage: string;
  contact_email: string;
  industry: string;
  website: string;
  location: string;
}

interface ProjectDetailsData {
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
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isJobSeeker, setIsJobSeeker] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  };

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

        // Fetch project details including project_id for tasks
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
              project_id,
              title,
              description,
              status,
              equity_allocation,
              skills_required,
              timeframe,
              skill_requirements,
              task_status,
              completion_percentage,
              created_at
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
          project_id: projectData.id,
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
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={handleGoBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <ProjectHeader
            title={project.title}
            companyName={project.business.company_name}
            status={project.status}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Project Details</h3>
              <p className="mt-2">{project.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Timeframe</h4>
                <p>{project.project_timeframe}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Equity Allocation</h4>
                <p>{project.equity_allocation}%</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company Stage</h4>
                <p>{project.business.project_stage}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Skills Required</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Available Roles</h3>
            <div className="space-y-4">
              {project.tasks.map((task) => (
                <Collapsible 
                  key={task.id} 
                  open={expandedTasks.has(task.id)}
                  onOpenChange={() => toggleTaskExpanded(task.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">{task.title}</h3>
                        <Badge variant="outline" className="ml-2">
                          {task.equity_allocation}% equity
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Timeframe: {task.timeframe}
                      </p>
                    </div>
                    {expandedTasks.has(task.id) ? (
                      <ArrowLeft className="h-5 w-5 transform rotate-90" />
                    ) : (
                      <ArrowLeft className="h-5 w-5 transform -rotate-90" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="space-y-3 mt-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                        <p className="text-sm mt-1">{task.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Required Skills</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.skills_required.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                        <Badge className="mt-1">{task.status}</Badge>
                      </div>
                      
                      {/* Apply button removed as requested */}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
              {project.tasks.length === 0 && (
                <p className="text-center text-muted-foreground">No available roles for this project.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
