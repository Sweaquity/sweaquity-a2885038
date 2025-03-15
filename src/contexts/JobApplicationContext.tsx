
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Application, Project } from '@/types/business';
import { toast } from 'sonner';

interface JobApplicationContextType {
  applications: Application[];
  pendingApplications: Application[];
  activeApplications: Application[];
  withdrawnApplications: Application[];
  rejectedApplications: Application[];
  isLoading: boolean;
  refreshApplications: () => Promise<void>;
  newApplicationsCount: number;
  newMessagesCount: number;
}

const JobApplicationContext = createContext<JobApplicationContextType | undefined>(undefined);

export const JobApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const loadProjectsWithApplications = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log("Loading projects for business ID:", session.user.id);

      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', session.user.id);

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        throw projectsError;
      }

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      const projectsWithApplications: Project[] = [];

      for (const project of projectsData) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('task_id, skill_requirements, equity_allocation, timeframe')
          .eq('project_id', project.project_id);

        if (tasksError) {
          console.error('Error fetching tasks for project:', project.project_id, tasksError);
          continue;
        }
        
        const taskIds = tasksData.map(task => task.task_id);

        if (taskIds.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .in('task_id', taskIds);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          continue;
        }

        if (!applicationsData || applicationsData.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        const applicationsWithProfiles = [];

        for (const app of applicationsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, title, location, employment_preference, skills')
            .eq('id', app.user_id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile for user:', app.user_id, profileError);
            continue;
          }

          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('title, description, skills_required, skill_requirements, equity_allocation, timeframe')
            .eq('task_id', app.task_id)
            .maybeSingle();

          if (taskError) {
            console.error('Error fetching task details:', taskError);
            continue;
          }

          let userSkills = [];
          if (profileData?.skills) {
            try {
              if (typeof profileData.skills === 'string') {
                const parsedSkills = JSON.parse(profileData.skills);
                if (Array.isArray(parsedSkills)) {
                  userSkills = parsedSkills.map(s => 
                    typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                  );
                }
              } else if (Array.isArray(profileData.skills)) {
                userSkills = profileData.skills.map(s => 
                  typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                );
              }
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          }

          const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
          const taskRequiredSkills = taskData?.skill_requirements || [];
          
          let matchedSkills = 0;
          if (Array.isArray(taskRequiredSkills)) {
            taskRequiredSkills.forEach(skillObj => {
              const skillName = typeof skillObj === 'string' ? 
                skillObj.toLowerCase() : 
                (skillObj.skill ? skillObj.skill.toLowerCase() : '');
                
              if (skillName && userSkillNames.includes(skillName)) {
                matchedSkills++;
              }
            });
          }
          
          const skillMatch = taskRequiredSkills.length > 0 
            ? Math.round((matchedSkills / taskRequiredSkills.length) * 100) 
            : 0;

          applicationsWithProfiles.push({
            ...app,
            profile: {
              ...profileData,
              skills: userSkills
            },
            business_roles: {
              ...(taskData || {}),
              project: {
                title: project.title
              }
            },
            skillMatch
          });
        }

        projectsWithApplications.push({
          ...project,
          applications: applicationsWithProfiles
        });
      }

      setProjects(projectsWithApplications);
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      let newApps = 0;
      let newMsgs = 0;
      
      projectsWithApplications.forEach(project => {
        project.applications.forEach(app => {
          const appDate = new Date(app.applied_at);
          if (appDate > oneDayAgo && app.status === 'pending') {
            newApps++;
          }
          
          if (app.task_discourse) {
            const lastMessageMatch = app.task_discourse.match(/\[([^\]]+)\]/);
            if (lastMessageMatch) {
              try {
                const msgDate = new Date(lastMessageMatch[1]);
                if (msgDate > oneDayAgo) {
                  newMsgs++;
                }
              } catch (e) {
                console.error("Error parsing message date:", e);
              }
            }
          }
        });
      });
      
      setNewApplicationsCount(newApps);
      setNewMessagesCount(newMsgs);
    } catch (error) {
      console.error('Error loading projects with applications:', error);
      toast.error("Failed to load applications data");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadProjectsWithApplications();
    
    // Only set up the channel once
    if (!channelRef.current) {
      const channel = supabase
        .channel('application-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'job_applications'
          },
          () => {
            setNewApplicationsCount(prev => prev + 1);
            toast.info("New application received!");
            loadProjectsWithApplications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'job_applications',
            filter: 'task_discourse=neq.null'
          },
          () => {
            setNewMessagesCount(prev => prev + 1);
            toast.info("New message received!");
            loadProjectsWithApplications();
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
  
  // Get applications across all projects
  const getAllApplications = (): Application[] => {
    return projects.flatMap(project => project.applications);
  };
  
  // Get applications by status
  const getApplicationsByStatus = (statuses: string[]): Application[] => {
    return getAllApplications().filter(app => 
      statuses.includes(app.status.toLowerCase())
    );
  };
  
  // Computed properties
  const pendingApplications = getApplicationsByStatus(['pending', 'in review']);
  const activeApplications = getApplicationsByStatus(['negotiation', 'accepted']);
  const withdrawnApplications = getApplicationsByStatus(['withdrawn']);
  const rejectedApplications = getApplicationsByStatus(['rejected']);
  
  const value = {
    applications: getAllApplications(),
    pendingApplications,
    activeApplications,
    withdrawnApplications,
    rejectedApplications,
    isLoading,
    refreshApplications: loadProjectsWithApplications,
    newApplicationsCount,
    newMessagesCount
  };
  
  return (
    <JobApplicationContext.Provider value={value}>
      {children}
    </JobApplicationContext.Provider>
  );
};

export const useJobApplications = () => {
  const context = useContext(JobApplicationContext);
  if (context === undefined) {
    throw new Error('useJobApplications must be used within a JobApplicationProvider');
  }
  return context;
};
