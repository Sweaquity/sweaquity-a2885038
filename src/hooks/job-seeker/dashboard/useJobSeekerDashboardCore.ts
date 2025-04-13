
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Skill, JobApplication, EquityProject } from '@/types/consolidatedTypes';
import { Profile, ParsedCVData } from '@/types/jobSeeker';
import { convertToSkill, convertToJobApplication, convertToEquityProject } from '@/utils/typeConverters';
import { toast } from 'sonner';
import { CVFile } from '@/hooks/job-seeker/useCVData';
import { useNavigate } from 'react-router-dom';
import { LogEffort } from '@/types/consolidatedTypes';

export interface UseJobSeekerDashboardResult {
  isLoading: boolean;
  profile: Profile | null;
  cvUrl: string | null;
  applications: JobApplication[];
  equityProjects: EquityProject[];
  availableOpportunities: any[];
  skills: Skill[];
  parsedCvData?: ParsedCVData;
  userCVs: CVFile[];
  handleSignOut: () => Promise<void>;
  handleCvUpload: (file: File) => Promise<boolean>;
  handleProfileUpdate: (data: any) => Promise<boolean>;
  handleSkillsUpdate: (skills: Skill[]) => Promise<boolean>;
  refreshApplications: () => Promise<void>;
  handleAcceptJob: (jobAppId: string) => Promise<boolean>;
  handleWithdrawApplication: (jobAppId: string, reason?: string) => Promise<boolean>;
  handleLogEffort: (effort: LogEffort) => Promise<boolean>;
  hasBusinessProfile: boolean;
  onCvListUpdated: () => Promise<void>;
  handleTicketAction: (ticketId: string, action: string, data?: any) => Promise<void>;
}

export const useJobSeekerDashboardCore = (refreshTrigger = 0): UseJobSeekerDashboardResult => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [parsedCvData, setParsedCvData] = useState<ParsedCVData | undefined>(undefined);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);

  // Load the user's profile data
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      // Process skills data
      let parsedSkills: Skill[] = [];
      if (profileData?.skills) {
        try {
          if (typeof profileData.skills === 'string') {
            const skillsData = JSON.parse(profileData.skills);
            parsedSkills = Array.isArray(skillsData) ? 
              skillsData.map(convertToSkill) : [];
          } else if (Array.isArray(profileData.skills)) {
            parsedSkills = profileData.skills.map(convertToSkill);
          }
        } catch (e) {
          console.error("Error parsing skills:", e);
        }
      }

      setProfile({
        ...profileData,
        skills: parsedSkills
      });
      
      setSkills(parsedSkills);
      
      // Check if the user has a business profile
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('businesses_id', user.id)
        .maybeSingle();
        
      setHasBusinessProfile(!!businessData);
      
    } catch (error) {
      console.error('Error in loadProfile:', error);
    }
  }, [navigate]);

  // Load the user's CV data
  const loadCvData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: parsedData, error } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', user.id)
        .order('cv_upload_date', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error loading CV data:', error);
        return;
      }

      if (parsedData) {
        setCvUrl(parsedData.cv_url);
        setParsedCvData({
          skills: parsedData.skills || [],
          education: parsedData.education || [],
          careerHistory: parsedData.career_history || []
        });
      }
    } catch (error) {
      console.error('Error in loadCvData:', error);
    }
  }, []);

  // Load the user's job applications
  const loadApplications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks (
            title, description, equity_allocation, timeframe, skill_requirements,
            project:project_id (title)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      if (data) {
        const formattedApplications = data.map(convertToJobApplication);
        setApplications(formattedApplications);
      }
    } catch (error) {
      console.error('Error in loadApplications:', error);
    }
  }, []);

  // Load equity projects
  const loadEquityProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted job applications with equity data
      const { data: acceptedJobs, error } = await supabase
        .from('accepted_jobs')
        .select(`
          id, job_app_id, equity_agreed, jobs_equity_allocated, date_accepted,
          job_applications!inner (
            task_id, project_id, user_id, status
          )
        `)
        .eq('job_applications.user_id', user.id)
        .gt('equity_agreed', 0);

      if (error) {
        console.error('Error loading equity projects:', error);
        return;
      }

      if (!acceptedJobs || acceptedJobs.length === 0) {
        setEquityProjects([]);
        return;
      }

      // Get project details for the accepted jobs
      const projectIds = acceptedJobs.map(job => job.job_applications.project_id).filter(Boolean);
      
      if (projectIds.length === 0) {
        setEquityProjects([]);
        return;
      }

      const { data: projects, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .in('project_id', projectIds);

      if (projectsError) {
        console.error('Error loading project details:', projectsError);
        return;
      }

      // Map projects with equity data
      const equityProjectsList = acceptedJobs.map(job => {
        const relatedProject = projects?.find(p => p.project_id === job.job_applications.project_id);
        
        if (relatedProject) {
          return convertToEquityProject({
            ...relatedProject,
            equity_agreed: job.equity_agreed,
            jobs_equity_allocated: job.jobs_equity_allocated,
            date_accepted: job.date_accepted,
            job_app_id: job.job_app_id,
            task_id: job.job_applications.task_id
          });
        }
        
        // If no project found, create a minimal entry
        return convertToEquityProject({
          project_id: job.job_applications.project_id,
          title: 'Unknown Project',
          equity_amount: job.equity_agreed,
          jobs_equity_allocated: job.jobs_equity_allocated,
          status: 'active',
          task_id: job.job_applications.task_id
        });
      });

      setEquityProjects(equityProjectsList);
    } catch (error) {
      console.error('Error in loadEquityProjects:', error);
    }
  }, []);

  // Load available opportunities
  const loadOpportunities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get user's current applications to filter them out
      const { data: userApps } = await supabase
        .from('job_applications')
        .select('task_id')
        .eq('user_id', user.id);
        
      const appliedTaskIds = userApps ? userApps.map(app => app.task_id) : [];

      // Get active projects with tasks
      const { data: projects, error } = await supabase
        .from('business_projects')
        .select(`
          *,
          sub_tasks:project_sub_tasks (*)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading opportunities:', error);
        return;
      }

      // Filter out tasks user has already applied for
      const availableProjects = projects.map(project => {
        const filteredTasks = project.sub_tasks.filter(
          (task: any) => !appliedTaskIds.includes(task.task_id)
        );
        
        return {
          ...project,
          sub_tasks: filteredTasks
        };
      }).filter(p => p.sub_tasks.length > 0); // Only keep projects with available tasks

      setAvailableOpportunities(availableProjects);
    } catch (error) {
      console.error('Error in loadOpportunities:', error);
    }
  }, []);

  const loadUserCVs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch all user CV files from the cv_parsed_data table
      const { data, error } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', user.id)
        .order('cv_upload_date', { ascending: false });
        
      if (error) {
        console.error('Error loading user CVs:', error);
        return;
      }
      
      if (data) {
        const cvFiles: CVFile[] = data.map(cv => ({
          id: cv.id,
          url: cv.cv_url || '',
          uploadDate: cv.cv_upload_date || new Date().toISOString(),
          isDefault: false, // We'll set this later
        }));
        
        // Check if user has a default CV in profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('cv_url')
          .eq('id', user.id)
          .single();
        
        if (profileData?.cv_url) {
          // Mark the CV that matches the profile's CV URL as default
          const defaultCvUrl = profileData.cv_url;
          cvFiles.forEach(cv => {
            cv.isDefault = cv.url === defaultCvUrl;
          });
        } else if (cvFiles.length > 0) {
          // If no default CV is set in profile, mark the most recent as default
          cvFiles[0].isDefault = true;
        }
        
        setUserCVs(cvFiles);
      }
    } catch (error) {
      console.error('Error loading user CVs:', error);
    }
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
      return;
    }
    
    toast.success('Signed out successfully');
    navigate('/login');
  };

  // Handle updating profile with new CV data
  const handleCvUpload = async (file: File): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload a CV');
        return false;
      }

      // Create a file path for the CV
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `cv/${fileName}`;
      
      // Upload the file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading CV:', uploadError);
        toast.error('Error uploading CV');
        return false;
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = await supabase
        .storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        console.error('Error getting public URL for CV');
        toast.error('Error processing CV');
        return false;
      }

      const publicUrl = publicUrlData.publicUrl;

      // Update profile with new CV URL
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          cv_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Error updating profile with CV URL:', profileUpdateError);
        toast.error('Error updating profile');
        return false;
      }

      // Create a record in cv_parsed_data
      const { error: cvDataError } = await supabase
        .from('cv_parsed_data')
        .insert({
          user_id: user.id,
          cv_url: publicUrl,
          cv_upload_date: new Date().toISOString()
        });

      if (cvDataError) {
        console.error('Error saving CV data:', cvDataError);
        toast.error('Error saving CV data');
        return false;
      }

      // TODO: In a real implementation, parse the CV and extract skills, education, etc.
      // For now, we'll just set the CV URL

      setCvUrl(publicUrl);
      loadProfile();
      loadCvData();
      loadUserCVs();
      
      toast.success('CV uploaded successfully');
      return true;
    } catch (error) {
      console.error('Error in handleCvUpload:', error);
      toast.error('Error uploading CV');
      return false;
    }
  };

  // Handle updating skills
  const handleSkillsUpdate = async (updatedSkills: Skill[]): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to update skills');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          skills: updatedSkills,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating skills:', error);
        toast.error('Error updating skills');
        return false;
      }

      setSkills(updatedSkills);
      if (profile) {
        setProfile({
          ...profile,
          skills: updatedSkills
        });
      }
      
      toast.success('Skills updated successfully');
      return true;
    } catch (error) {
      console.error('Error in handleSkillsUpdate:', error);
      toast.error('Error updating skills');
      return false;
    }
  };

  // Handle accept job
  const handleAcceptJob = async (jobAppId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // First update the job application to mark as accepted by job seeker
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          accepted_jobseeker: true,
          updated_at: new Date().toISOString(),
          status: 'accepted'
        })
        .eq('job_app_id', jobAppId)
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('Error accepting job:', updateError);
        toast.error('Error accepting job');
        return false;
      }
      
      // Check if an accepted_jobs record already exists
      const { data: existingRecord } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', jobAppId)
        .maybeSingle();
        
      if (!existingRecord) {
        // Create a record in accepted_jobs
        const { error: acceptedJobError } = await supabase
          .from('accepted_jobs')
          .insert({
            job_app_id: jobAppId,
            date_accepted: new Date().toISOString()
          });
          
        if (acceptedJobError) {
          console.error('Error creating accepted job record:', acceptedJobError);
          toast.error('Error finalizing job acceptance');
          return false;
        }
      }
      
      // Refresh applications
      await loadApplications();
      await loadEquityProjects();
      
      toast.success('Job accepted successfully');
      return true;
    } catch (error) {
      console.error('Error in handleAcceptJob:', error);
      toast.error('Error accepting job');
      return false;
    }
  };

  // Handle withdraw application
  const handleWithdrawApplication = async (jobAppId: string, reason?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'withdrawn',
          notes: reason || 'Withdrawn by applicant',
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', jobAppId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error withdrawing application:', error);
        toast.error('Error withdrawing application');
        return false;
      }

      await loadApplications();
      toast.success('Application withdrawn successfully');
      return true;
    } catch (error) {
      console.error('Error in handleWithdrawApplication:', error);
      toast.error('Error withdrawing application');
      return false;
    }
  };

  // Handle logging effort on a project
  const handleLogEffort = async (effort: LogEffort): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Create a time entry record
      const { error } = await supabase
        .from('time_entries')
        .insert({
          job_app_id: effort.jobAppId,
          ticket_id: effort.taskId,
          user_id: user.id,
          hours_logged: effort.hours,
          description: effort.description,
          start_time: effort.date.toISOString(),
          end_time: new Date(effort.date.getTime() + effort.hours * 3600000).toISOString()
        });

      if (error) {
        console.error('Error logging effort:', error);
        toast.error('Error logging effort');
        return false;
      }

      toast.success('Effort logged successfully');
      await loadEquityProjects();
      return true;
    } catch (error) {
      console.error('Error in handleLogEffort:', error);
      toast.error('Error logging effort');
      return false;
    }
  };

  // Handle ticket actions
  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (action === 'update_status') {
        await supabase
          .from('tickets')
          .update({ status: data.status })
          .eq('id', ticketId);
      } else if (action === 'log_time') {
        await supabase
          .from('ticket_time_entries')
          .insert({
            ticket_id: ticketId,
            user_id: user.id,
            hours_logged: data.hours,
            description: data.description,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + data.hours * 60 * 60 * 1000).toISOString()
          });
      } else if (action === 'update_progress') {
        await supabase
          .from('tickets')
          .update({ completion_percentage: data.progress })
          .eq('id', ticketId);
      }
      
      toast.success('Ticket updated');
    } catch (error) {
      console.error('Error in handleTicketAction:', error);
      toast.error('Error updating ticket');
    }
  };

  // Refresh applications
  const refreshApplications = useCallback(async () => {
    await loadApplications();
    await loadEquityProjects();
  }, [loadApplications, loadEquityProjects]);

  // Refresh CV list
  const onCvListUpdated = useCallback(async () => {
    await loadUserCVs();
    await loadCvData();
  }, [loadUserCVs, loadCvData]);

  // Effect to load data on initial render and when refreshTrigger changes
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadProfile(),
          loadCvData(),
          loadApplications(),
          loadEquityProjects(),
          loadOpportunities(),
          loadUserCVs()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [
    loadProfile, 
    loadCvData, 
    loadApplications, 
    loadEquityProjects, 
    loadOpportunities,
    loadUserCVs,
    refreshTrigger
  ]);

  return {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    skills,
    parsedCvData,
    userCVs,
    handleSignOut,
    handleCvUpload,
    handleProfileUpdate: async () => false, // Not implemented yet
    handleSkillsUpdate,
    refreshApplications,
    handleAcceptJob,
    handleWithdrawApplication,
    handleLogEffort,
    hasBusinessProfile,
    onCvListUpdated,
    handleTicketAction
  };
};
