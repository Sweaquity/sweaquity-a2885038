
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Skill } from "@/types/jobSeeker";
import { BackButton } from "@/components/projects/application/BackButton";
import { BusinessDetails } from "@/components/projects/application/BusinessDetails";
import { TaskSelection } from "@/components/projects/application/TaskSelection";
import { ApplicationFormSection } from "@/components/projects/application/ApplicationFormSection";

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
  created_at: string;
  project_id: string;
  matchScore?: number;
  matchedSkills?: string[];
}

interface JobSeekerProfile {
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  employment_preference: string;
  created_at: string;
  skills: Skill[];
}

const ProjectApplicationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [hasStoredCV, setHasStoredCV] = useState(false);
  const [storedCVUrl, setStoredCVUrl] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<SubTask | null>(null);

  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = subTasks.find(t => t.id === taskId) || null;
    setSelectedTask(task);
  };

  const calculateSkillMatch = (task: SubTask, userSkills: Skill[]): { 
    matchScore: number, 
    matchedSkills: string[] 
  } => {
    const requiredSkills = task.skill_requirements?.map(sr => sr.skill) || task.skills_required;
    
    if (!requiredSkills || requiredSkills.length === 0) {
      return { matchScore: 0, matchedSkills: [] };
    }
    
    const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
    
    const matchedSkills = requiredSkills.filter(skill => 
      userSkillNames.some(userSkill => userSkill === skill.toLowerCase())
    );
    
    const matchScore = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
      : 0;
    
    return { matchScore, matchedSkills };
  };

  const updateTasksWithNewSkills = (updatedSkills: Skill[]) => {
    if (selectedTask) {
      const { matchScore, matchedSkills } = calculateSkillMatch(selectedTask, updatedSkills);
      selectedTask.matchScore = matchScore;
      selectedTask.matchedSkills = matchedSkills;
      setSelectedTask({ ...selectedTask });
    }

    setSubTasks(subTasks.map(task => {
      const { matchScore, matchedSkills } = calculateSkillMatch(task, updatedSkills);
      return {
        ...task,
        matchScore,
        matchedSkills
      };
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view this page");
          navigate('/auth/seeker');
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

        let extractedSkills: Skill[] = [];
        if (profileData.skills) {
          try {
            if (typeof profileData.skills === 'string') {
              const parsedSkills = JSON.parse(profileData.skills);
              if (Array.isArray(parsedSkills)) {
                extractedSkills = parsedSkills.map(s => 
                  typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                );
              }
            } else if (Array.isArray(profileData.skills)) {
              extractedSkills = profileData.skills.map(s => 
                typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
              );
            }
          } catch (e) {
            console.error("Error parsing skills:", e);
          }
        }
        
        setUserSkills(extractedSkills);
        setJobSeekerProfile({
          ...profileData,
          skills: extractedSkills
        });

        const { data: userApplications, error: applicationError } = await supabase
          .from('job_applications')
          .select('task_id, status')
          .eq('user_id', session.user.id);
          
        if (applicationError) throw applicationError;
          
        const unavailableTaskIds = new Set(
          userApplications
            .filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
            .map(app => app.task_id)
        );
          
        console.log("Unavailable task IDs:", Array.from(unavailableTaskIds));

        const processedTasks = taskData
          .filter(task => task.status === 'open' && !unavailableTaskIds.has(task.id))
          .map(task => {
            const { matchScore, matchedSkills } = calculateSkillMatch(task, extractedSkills);
            return {
              ...task,
              matchScore,
              matchedSkills
            };
          });
        
        console.log("All processed tasks:", processedTasks.map(t => ({ 
          id: t.id, 
          title: t.title, 
          score: t.matchScore 
        })));
        
        const availableTasks = processedTasks
          .sort((a, b) => b.matchScore! - a.matchScore!);
          
        console.log("Matched tasks after filtering:", availableTasks.map(t => ({
          id: t.id,
          title: t.title,
          score: t.matchScore
        })));

        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('cv_url')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const { data: cvUrlData } = await supabase
          .from('profiles')
          .select('cv_url')
          .eq('id', session.user.id)
          .single();

        const { data: buckets } = await supabase.storage.listBuckets();
        const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
        
        if (!cvsBucketExists) {
          console.log("CV storage bucket doesn't exist, attempting to create it");
          try {
            const { error: bucketError } = await supabase.storage.createBucket('cvs', {
              public: true
            });
            
            if (bucketError) {
              console.error("Error creating cvs bucket:", bucketError);
            } else {
              console.log("Successfully created cvs bucket");
            }
          } catch (bucketErr) {
            console.error("Error creating storage bucket:", bucketErr);
          }
        }

        setBusinessDetails(projectData.businesses);
        setProjectDetails(projectData);
        setSubTasks(availableTasks);
        setHasStoredCV(!!cvData?.cv_url || !!cvUrlData?.cv_url);
        setStoredCVUrl(cvData?.cv_url || cvUrlData?.cv_url || null);

        if (availableTasks.length > 0) {
          setSelectedTaskId(availableTasks[0].id);
          setSelectedTask(availableTasks[0]);
        }

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
  }, [id, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!businessDetails || !projectDetails) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center mb-4">
        <BackButton onClick={handleGoBack} />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <BusinessDetails 
            businessDetails={businessDetails}
            projectDetails={projectDetails}
            userSkills={userSkills}
          />
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <TaskSelection 
            subTasks={subTasks}
            selectedTaskId={selectedTaskId}
            selectedTask={selectedTask}
            onTaskSelect={handleTaskSelect}
          />
        </CardContent>
      </Card>

      {subTasks.length > 0 && selectedTask && (
        <ApplicationFormSection
          projectId={id || ''}
          selectedTaskId={selectedTaskId}
          projectTitle={projectDetails.title}
          selectedTask={selectedTask}
          jobSeekerProfile={jobSeekerProfile}
          userSkills={userSkills}
          setUserSkills={setUserSkills}
          updateTasksWithNewSkills={updateTasksWithNewSkills}
        />
      )}
    </div>
  );
};

export default ProjectApplicationPage;
