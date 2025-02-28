
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Briefcase, Users2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skill } from "@/types/jobSeeker";

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

export const ProjectApplicationPage = () => {
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
  const [newSkill, setNewSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");

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

  const addSkill = async () => {
    if (newSkill.trim() === "") {
      toast.error("Please enter a skill name");
      return;
    }

    if (userSkills.some((s) => s.skill.toLowerCase() === newSkill.toLowerCase())) {
      toast.error("This skill already exists in your profile");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newSkillObject = { skill: newSkill, level: skillLevel };
      const updatedSkills = [...userSkills, newSkillObject];

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ skills: updatedSkills })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      const { error: cvDataError } = await supabase
        .from('cv_parsed_data')
        .update({ skills: updatedSkills })
        .eq('user_id', session.user.id);

      if (cvDataError && cvDataError.code !== 'PGRST116') {
        throw cvDataError;
      }

      setUserSkills(updatedSkills);
      setNewSkill("");
      
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
      
      toast.success("Skill added successfully");
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error("Failed to add skill");
    }
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
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{projectDetails.title}</h2>
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
            <span>{businessDetails.company_name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                <p className="text-sm mt-2">{projectDetails.description}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Equity Details</h4>
              <div className="space-y-2">
                <div>Total Allocation: {projectDetails.equity_allocation}%</div>
                <div>Allocated: {projectDetails.equity_allocated}%</div>
                <div>Project Completion: {projectDetails.completion_percentage}%</div>
              </div>
              <div className="mt-3">
                <h4 className="font-medium mb-1">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {projectDetails.skills_required?.map((skill, index) => {
                    const isMatch = userSkills.some(us => us.skill.toLowerCase() === skill.toLowerCase());
                    return (
                      <Badge 
                        key={index} 
                        variant={isMatch ? "default" : "secondary"}
                      >
                        {skill}
                        {isMatch && " ✓"}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Available Matching Tasks</h3>
            {subTasks.length > 0 ? (
              <div>
                <div className="space-y-4 mb-4">
                  <label className="text-sm font-medium">Select a task to apply for:</label>
                  <Select
                    value={selectedTaskId || ''}
                    onValueChange={handleTaskSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {subTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div>
                            <span className="font-medium">{task.title}</span>
                            <span className="ml-2 text-xs">{task.matchScore}% skill match</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTask && (
                  <Card className="mb-4">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium">Task Details</h5>
                          <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-muted-foreground">Equity</h6>
                            <p>{selectedTask.equity_allocation}%</p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-muted-foreground">Timeframe</h6>
                            <p>{selectedTask.timeframe}</p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-muted-foreground">Created</h6>
                            <p>{format(new Date(selectedTask.created_at || projectDetails.created_at), 'PPP')}</p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-muted-foreground">Completion</h6>
                            <p>{selectedTask.completion_percentage || 0}%</p>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-medium text-muted-foreground">Matched Skills</h6>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedTask.matchedSkills?.map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="default"
                              >
                                {skill} ✓
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-medium text-muted-foreground">All Required Skills</h6>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedTask.skills_required?.map((skill, index) => {
                              const isMatch = selectedTask.matchedSkills?.includes(skill);
                              return (
                                <Badge 
                                  key={index} 
                                  variant={isMatch ? "default" : "secondary"}
                                >
                                  {skill}
                                  {isMatch && " ✓"}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-medium text-muted-foreground">Skill Match</h6>
                          <div className="w-full bg-secondary h-2 rounded-full mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${selectedTask.matchScore}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedTask.matchScore}% match with your skills
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-center text-muted-foreground">No matching tasks found. Add more skills to see tasks that match your profile.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {subTasks.length > 0 && selectedTask && (
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
                
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Your Skills</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userSkills.map((skill, index) => {
                      const isMatch = selectedTask.skills_required.some(
                        s => s.toLowerCase() === skill.skill.toLowerCase()
                      );
                      return (
                        <Badge key={index} variant={isMatch ? "default" : "secondary"}>
                          {skill.skill} ({skill.level}) {isMatch && "✓"}
                        </Badge>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 md:col-span-1">
                      <Input
                        placeholder="Add a new skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Select
                        value={skillLevel}
                        onValueChange={(value: "Beginner" | "Intermediate" | "Expert") => setSkillLevel(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Skill level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <Button 
                        onClick={addSkill} 
                        type="button" 
                        className="w-full"
                        variant="outline"
                      >
                        Add Skill
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ApplicationForm
              projectId={id || ''}
              taskId={selectedTaskId || ''}
              projectTitle={projectDetails.title}
              taskTitle={selectedTask?.title}
              onApplicationSubmitted={() => {
                toast.success("Application submitted successfully");
                navigate("/seeker/dashboard?tab=applications");
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectApplicationPage;
