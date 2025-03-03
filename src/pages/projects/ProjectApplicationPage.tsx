import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skill } from "@/types/jobSeeker";

interface ApplicationPageState {
  taskId?: string;
}

interface Business {
  company_name: string;
  // Add other business properties if needed
}

interface ProjectTask {
  task_id: string;
  title: string;
  description: string;
  timeframe: string;
  equity_allocation: number;
  skills_required: string[];
  skill_requirements: Array<{
    skill: string;
    level: "Beginner" | "Intermediate" | "Expert";
  }>;
}

const ProjectApplicationPage = () => {
  const { id: projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ApplicationPageState;
  
  const [isLoading, setIsLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (state?.taskId) {
      setSelectedTaskId(state.taskId);
    }
    
    loadData();
    loadUserSkills();
  }, [projectId, state]);
  
  const loadUserSkills = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      
      if (data?.skills) {
        setUserSkills(Array.isArray(data.skills) ? data.skills : JSON.parse(data.skills));
      }
    } catch (error) {
      console.error("Error loading user skills:", error);
    }
  };
  
  const loadData = async () => {
    if (!projectId) {
      toast.error("No project ID provided");
      navigate(-1);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First, load project details
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
          businesses(company_name)
        `)
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (projectError) {
        console.error("Error fetching project:", projectError);
        throw projectError;
      }
      
      if (!projectData) {
        toast.error("Project not found");
        navigate(-1);
        return;
      }
      
      setProjectTitle(projectData.title);
      
      // Fix: Correctly access the company_name from the businesses join
      if (projectData.businesses && Array.isArray(projectData.businesses)) {
        // If businesses is an array, take the first item
        setCompanyName(projectData.businesses[0]?.company_name || "Unknown Company");
      } else if (projectData.businesses) {
        // If businesses is an object
        setCompanyName((projectData.businesses as any).company_name || "Unknown Company");
      } else {
        setCompanyName("Unknown Company");
      }
      
      setBusinessId(projectData.business_id);
      
      // Then, load tasks for this project
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'open');
      
      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }
      
      setTasks(tasksData || []);
      
      // If there's a taskId in the state and it's valid, use it
      // Otherwise, use the first task
      if (state?.taskId && tasksData?.some(task => task.task_id === state.taskId)) {
        setSelectedTaskId(state.taskId);
      } else if (tasksData && tasksData.length > 0 && !selectedTaskId) {
        setSelectedTaskId(tasksData[0].task_id);
      }
      
    } catch (error) {
      console.error("Error loading application details for project:", projectId, "task:", state?.taskId, error);
      toast.error("Failed to load project details");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };
  
  const handleSubmit = async (formData: {
    message: string;
    acceptTerms: boolean;
    cvUrl?: string;
  }) => {
    if (!selectedTaskId || !projectId) {
      toast.error("No task selected");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to apply");
        navigate('/auth/seeker');
        return;
      }
      
      // Check if user already applied for this task
      const { data: existingApps, error: checkError } = await supabase
        .from('job_applications')
        .select('job_app_id, status')
        .eq('user_id', session.user.id)
        .eq('task_id', selectedTaskId);
      
      if (checkError) throw checkError;
      
      // If there's an existing application that isn't withdrawn or rejected, show error
      if (existingApps && existingApps.length > 0) {
        const activeApp = existingApps.find(app => 
          !['withdrawn', 'rejected'].includes(app.status.toLowerCase())
        );
        
        if (activeApp) {
          toast.error("You've already applied for this role");
          return;
        }
      }
      
      // Insert application
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          user_id: session.user.id,
          task_id: selectedTaskId,
          project_id: projectId,
          message: formData.message,
          cv_url: formData.cvUrl
        }])
        .select();
      
      if (error) throw error;
      
      toast.success("Application submitted successfully");
      navigate('/seeker/dashboard', { 
        state: { 
          activeTab: 'applications'
        } 
      });
      
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading application details...
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={goBack} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Apply for Role at {companyName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{projectTitle}</h2>
              {tasks.length > 1 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Available Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {tasks.map((task) => (
                      <Button
                        key={task.task_id}
                        variant={selectedTaskId === task.task_id ? "default" : "outline"}
                        onClick={() => handleTaskSelect(task.task_id)}
                      >
                        {task.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {selectedTaskId && (
              <ApplicationForm 
                projectId={projectId || ""}
                taskId={selectedTaskId}
                projectTitle={projectTitle}
                taskTitle={tasks.find(t => t.task_id === selectedTaskId)?.title}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectApplicationPage;
