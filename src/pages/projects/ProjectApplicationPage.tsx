import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skill } from "@/types/jobSeeker";

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
  const [searchParams] = useSearchParams();
  const taskIdFromQuery = searchParams.get('taskId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  
  useEffect(() => {
    if (taskIdFromQuery) {
      setSelectedTaskId(taskIdFromQuery);
    }
    
    loadData();
    loadUserSkills();
  }, [projectId, taskIdFromQuery]);
  
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
      
      // If there's a taskId in the query params and it's valid, use it
      // Otherwise, use the first task
      if (taskIdFromQuery && tasksData?.some(task => task.task_id === taskIdFromQuery)) {
        setSelectedTaskId(taskIdFromQuery);
      } else if (tasksData && tasksData.length > 0 && !selectedTaskId) {
        setSelectedTaskId(tasksData[0].task_id);
      }
      
    } catch (error) {
      console.error("Error loading application details for project:", projectId, "task:", taskIdFromQuery, error);
      toast.error("Failed to load project details");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    // Update URL with the new taskId without navigating
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('taskId', taskId);
    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString()
    }, { replace: true });
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center min-h-screen">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading application details...</span>
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
