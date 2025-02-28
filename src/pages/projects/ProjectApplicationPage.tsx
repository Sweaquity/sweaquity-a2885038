
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Clock, Coins, FileEdit, Star } from "lucide-react";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { SkillRequirement, Skill } from "@/types/jobSeeker";
import { setupCvStorageBucket, listUserCVs } from "@/utils/setupStorage";

interface Task {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  skill_requirements: SkillRequirement[];
  task_status: string;
  completion_percentage: number;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  business_id: string;
  skills_required: string[];
  status: string;
  created_at: string;
  equity_allocation: number;
  sub_tasks: Task[];
  business?: {
    company_name: string;
  };
}

const ProjectApplicationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [cvBucketExists, setCvBucketExists] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to view this page");
        navigate('/auth/seeker');
        return false;
      }
      return true;
    };

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) return;

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select(`
            *,
            business:businesses (
              company_name
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (projectError) {
          console.error('Error fetching project details:', projectError);
          toast.error("Failed to load project details");
          navigate('/seeker/dashboard?tab=opportunities');
          return;
        }

        if (!projectData) {
          console.error('Project not found:', id);
          toast.error("Project not found");
          navigate('/seeker/dashboard?tab=opportunities');
          return;
        }

        // Fetch sub-tasks for this project
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('project_id', id)
          .eq('status', 'open');

        if (tasksError) {
          console.error('Error fetching project tasks:', tasksError);
          toast.error("Failed to load project tasks");
          return;
        }

        // Merge project with tasks
        const project = {
          ...projectData,
          sub_tasks: tasksData || []
        };

        setProjectDetails(project);
        
        // Set first task as selected by default if available
        if (tasksData && tasksData.length > 0) {
          setSelectedTaskId(tasksData[0].id);
          setSelectedTask(tasksData[0]);
        }

        // Fetch user skills to highlight matching skills
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('skills')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!profileError && profileData && profileData.skills) {
              if (typeof profileData.skills === 'string') {
                try {
                  setUserSkills(JSON.parse(profileData.skills));
                } catch (e) {
                  console.error("Error parsing skills:", e);
                }
              } else {
                setUserSkills(profileData.skills);
              }
            }
          } catch (error) {
            console.error("Error fetching user skills:", error);
          }
          
          // Check if CV storage is ready and if the user has a CV uploaded
          await checkCVStorageAndUserCV(session.user.id);
        }

      } catch (error) {
        console.error('Error loading application page:', error);
        toast.error("An error occurred while loading this page");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const checkCVStorageAndUserCV = async (userId: string) => {
    try {
      // Check if CV storage bucket exists
      const bucketExists = await setupCvStorageBucket();
      setCvBucketExists(bucketExists);
      
      if (bucketExists) {
        // Try to get user's default CV URL
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('cv_url')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileData?.cv_url) {
            setStoredCVUrl(profileData.cv_url);
            setHasStoredCV(true);
          }
        } catch (error) {
          console.error("Error fetching profile CV URL:", error);
        }
        
        try {
          const { data: cvData } = await supabase
            .from('cv_parsed_data')
            .select('cv_url')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (cvData?.cv_url && !storedCVUrl) {
            setStoredCVUrl(cvData.cv_url);
            setHasStoredCV(true);
          }
        } catch (error) {
          console.error("Error fetching CV data:", error);
        }
        
        // If no default CV is set, check if user has any CVs uploaded
        if (!storedCVUrl) {
          const cvFiles = await listUserCVs(userId);
          setHasStoredCV(cvFiles.length > 0);
        }
      }
    } catch (error) {
      console.error("Error checking CV storage:", error);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    if (!projectDetails) return;
    
    const task = projectDetails.sub_tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskId(taskId);
      setSelectedTask(task);
    }
  };

  // Filter tasks to only show those with status 'open'
  const openTasks = projectDetails?.sub_tasks.filter(task => task.status === 'open') || [];

  // Get matching skills between user and task requirements
  const getMatchingSkills = (task: Task): string[] => {
    if (!task.skills_required && !task.skill_requirements || !userSkills?.length) return [];
    
    const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
    
    if (task.skill_requirements && task.skill_requirements.length > 0) {
      return task.skill_requirements
        .map(sr => sr.skill)
        .filter(skill => userSkillNames.includes(skill.toLowerCase()));
    }
    
    return (task.skills_required || []).filter(skill => 
      userSkillNames.includes(skill.toLowerCase())
    );
  };

  // Calculate skill match percentage
  const calculateMatchPercentage = (task: Task): number => {
    const skillsToMatch = task.skill_requirements?.map(sr => sr.skill) || task.skills_required || [];
    if (skillsToMatch.length === 0) return 0;
    
    const matchingCount = getMatchingSkills(task).length;
    return Math.round((matchingCount / skillsToMatch.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-bold mb-2">Project not found</h2>
          <p className="mb-4">The project you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/seeker/dashboard?tab=opportunities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opportunities
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/seeker/dashboard?tab=opportunities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opportunities
          </Link>
        </Button>
      </div>

      {/* Project header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{projectDetails.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-muted-foreground">
            {projectDetails.business?.company_name || "Unknown Company"}
          </p>
          <Badge variant="outline">
            {projectDetails.status.charAt(0).toUpperCase() + projectDetails.status.slice(1)}
          </Badge>
        </div>
        <p className="mt-4">{projectDetails.description}</p>
      </div>

      {openTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <h3 className="text-xl font-semibold mb-2">No open tasks available</h3>
              <p className="text-muted-foreground mb-4">This project currently has no open tasks to apply for.</p>
              <Button asChild>
                <Link to="/seeker/dashboard?tab=opportunities">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Browse other opportunities
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Available Tasks</CardTitle>
                <CardDescription>
                  Select a task to apply for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openTasks.map(task => {
                    const matchPercentage = calculateMatchPercentage(task);
                    return (
                      <div 
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTaskId === task.id ? 'border-primary bg-primary/10' : 'hover:bg-secondary'
                        }`}
                        onClick={() => handleTaskSelect(task.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge>{matchPercentage}% match</Badge>
                        </div>
                        <div className="flex gap-2 items-center mt-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{task.timeframe}</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1 text-sm text-muted-foreground">
                          <Coins className="h-4 w-4" />
                          <span>{task.equity_allocation}% equity</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task details and application form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Task Details</TabsTrigger>
                <TabsTrigger value="apply">Apply</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                {selectedTask && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedTask.title}</CardTitle>
                      <div className="flex gap-2 items-center mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{selectedTask.timeframe}</span>
                        <Coins className="h-4 w-4 text-muted-foreground ml-2" />
                        <span className="text-sm text-muted-foreground">{selectedTask.equity_allocation}% equity</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Description</h3>
                        <p>{selectedTask.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Your Matching Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {getMatchingSkills(selectedTask).length > 0 ? (
                            getMatchingSkills(selectedTask).map((skill, i) => (
                              <Badge key={i} className="flex items-center gap-1">
                                <Star className="h-3 w-3" /> {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No matching skills found</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <TabsTrigger value="apply" className="w-full">
                          <FileEdit className="mr-2 h-4 w-4" />
                          Apply for this Task
                        </TabsTrigger>
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="apply">
                {selectedTask && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Apply for Task</CardTitle>
                      <CardDescription>
                        Submit your application for {selectedTask.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ApplicationForm
                        projectId={id || ''}
                        taskId={selectedTaskId || ''}
                        projectTitle={projectDetails.title}
                        taskTitle={selectedTask.title}
                        hasStoredCV={hasStoredCV}
                        storedCVUrl={storedCVUrl}
                        onApplicationSubmitted={() => {
                          toast.success("Application submitted successfully");
                          navigate("/seeker/dashboard?tab=applications");
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectApplicationPage;
