
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ProjectApplicationPage = () => {
  const { id: projectId, taskId: urlTaskId } = useParams<{ id: string; taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState<{
    title: string;
    companyName: string;
    status: string;
    description: string;
    equityAllocation: number;
    projectTimeframe: string;
    skillsRequired: string[];
  }>({
    title: "",
    companyName: "",
    status: "",
    description: "",
    equityAllocation: 0,
    projectTimeframe: "",
    skillsRequired: []
  });
  const [taskDetails, setTaskDetails] = useState<{
    taskId: string;
    title: string;
    description: string;
    equityAllocation: number;
    skillsRequired: string[];
    timeframe: string;
  }>({
    taskId: "",
    title: "",
    description: "",
    equityAllocation: 0,
    skillsRequired: [],
    timeframe: ""
  });
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);

  const { state } = location;
  const taskId = urlTaskId || (state && state.taskId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to apply");
        navigate("/auth/seeker");
        return false;
      }
      return true;
    };

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check auth first
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
        
        // If we don't have a project ID or task ID, show an error
        if (!projectId || !taskId) {
          toast.error("Missing project or task information");
          navigate("/seeker/dashboard");
          return;
        }

        console.log("Loading application details for project:", projectId, "task:", taskId);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            title,
            description,
            status,
            equity_allocation,
            project_timeframe,
            skills_required,
            business_id,
            businesses (
              company_name
            )
          `)
          .eq('project_id', projectId)
          .single();
        
        if (projectError) {
          console.error("Error fetching project:", projectError);
          toast.error("Failed to load project details");
          navigate("/seeker/dashboard");
          return;
        }
        
        // Set project details
        let companyName = "Unknown Company";
        
        if (projectData.businesses) {
          // Handle case where businesses might be received in different formats
          if (typeof projectData.businesses === 'object' && projectData.businesses !== null) {
            // If it's a direct object reference
            companyName = projectData.businesses.company_name || "Unknown Company";
          }
        }
          
        setProjectDetails({
          title: projectData.title || "Untitled Project",
          companyName: companyName,
          status: projectData.status || "unknown",
          description: projectData.description || "",
          equityAllocation: projectData.equity_allocation || 0,
          projectTimeframe: projectData.project_timeframe || "",
          skillsRequired: projectData.skills_required || []
        });
        
        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('task_id, title, description, equity_allocation, skills_required, timeframe')
          .eq('task_id', taskId)
          .single();
        
        if (taskError) {
          console.error("Error fetching task:", taskError);
          toast.error("Failed to load task details");
          navigate("/seeker/dashboard");
          return;
        }
        
        setTaskDetails({
          taskId: taskData.task_id,
          title: taskData.title,
          description: taskData.description || "",
          equityAllocation: taskData.equity_allocation || 0,
          skillsRequired: taskData.skills_required || [],
          timeframe: taskData.timeframe || ""
        });
        
        // Load user's CV data
        await loadUserCVData();
        
      } catch (error) {
        console.error("Error in ProjectApplicationPage:", error);
        toast.error("An error occurred while loading the application page");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [projectId, taskId, navigate, state]);
  
  const loadUserCVData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Check if user has a CV
      const { data: profileData } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', session.user.id)
        .single();
      
      if (profileData?.cv_url) {
        setHasStoredCV(true);
        setStoredCVUrl(profileData.cv_url);
      }
    } catch (error) {
      console.error("Error loading CV data:", error);
    }
  };
  
  const handleCancel = () => {
    navigate(-1);
  };
  
  const handleApplicationSubmitted = () => {
    toast.success("Application submitted successfully!");
    navigate("/seeker/dashboard?tab=applications", { 
      state: { activeTab: "applications" } 
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {isLoading ? (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading application details...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="mb-4"
          >
            Back
          </Button>
          
          <Card className="w-full">
            <CardHeader>
              <ProjectHeader 
                title={projectDetails.title}
                companyName={projectDetails.companyName}
                status={projectDetails.status}
              />
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-md font-medium">Project Description</h3>
                  <p className="text-sm text-muted-foreground mt-1">{projectDetails.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium">Project Timeframe</h4>
                    <p className="text-muted-foreground">{projectDetails.projectTimeframe}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Total Equity</h4>
                    <p className="text-muted-foreground">{projectDetails.equityAllocation}%</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <CardTitle className="text-xl">Apply for Role: {taskDetails.title}</CardTitle>
                <div className="mt-2 space-y-2 text-sm">
                  <p>{taskDetails.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <h4 className="font-medium">Equity Allocation</h4>
                      <p className="text-muted-foreground">{taskDetails.equityAllocation}%</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Timeframe</h4>
                      <p className="text-muted-foreground">{taskDetails.timeframe}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ApplicationForm 
                projectId={projectId || ""}
                taskId={taskDetails.taskId}
                projectTitle={projectDetails.title}
                taskTitle={taskDetails.title}
                onCancel={handleCancel}
                hasStoredCV={hasStoredCV}
                storedCVUrl={storedCVUrl}
                onApplicationSubmitted={handleApplicationSubmitted}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProjectApplicationPage;
