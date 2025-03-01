
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
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState<{
    title: string;
    companyName: string;
    status: string;
  }>({
    title: "",
    companyName: "",
    status: ""
  });
  const [taskDetails, setTaskDetails] = useState<{
    taskId: string;
    title: string;
  }>({
    taskId: "",
    title: ""
  });
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);

  const { state } = location;

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
        
        // Try to use data from location state first (passed from TaskCard)
        if (state && state.taskId) {
          console.log("Using task data from navigation state:", state);
          setTaskDetails({
            taskId: state.taskId,
            title: state.taskTitle || "Unknown Task"
          });
          
          // Set project details from state if available
          if (state.projectTitle || state.companyName) {
            setProjectDetails({
              title: state.projectTitle || "Unknown Project",
              companyName: state.companyName || "Unknown Company",
              status: "open"
            });
            
            // If we have all required info, we can skip the database query
            if (state.taskId && state.taskTitle && state.projectTitle && state.companyName) {
              await loadUserCVData();
              return;
            }
          }
        }
        
        if (!projectId) {
          toast.error("Project ID is missing");
          navigate("/seeker/dashboard");
          return;
        }
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            title,
            status,
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
        
        // Set project details - Fix: Properly access company_name
        const businessData = projectData.businesses;
        let companyName = "Unknown Company";
        
        // Carefully check the structure and type of businessData
        if (businessData && 
            typeof businessData === 'object' && 
            businessData !== null) {
          if ('company_name' in businessData) {
            // It's a single object with company_name property
            const rawCompanyName = (businessData as { company_name?: string | null }).company_name;
            companyName = typeof rawCompanyName === 'string' ? rawCompanyName : "Unknown Company";
          }
        }
          
        setProjectDetails({
          title: projectData.title,
          companyName: companyName,
          status: projectData.status
        });
        
        // If task ID not provided in state, get the first available task
        if (!state?.taskId) {
          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('task_id, title')
            .eq('project_id', projectId)
            .eq('status', 'open')
            .limit(1)
            .single();
          
          if (taskError) {
            console.error("Error fetching task:", taskError);
            toast.error("No available tasks found for this project");
            navigate("/seeker/dashboard");
            return;
          }
          
          setTaskDetails({
            taskId: taskData.task_id,
            title: taskData.title
          });
        }
        
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
  }, [projectId, navigate, state]);
  
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
              <CardTitle className="text-xl mt-4">Apply for Role</CardTitle>
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
