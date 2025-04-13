import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Profile, Skill } from '@/types/jobSeeker';
import { JobApplication, EquityProject } from '@/types/consolidatedTypes';

// Add the new imports at the top
import { convertToSkill, convertToJobApplication, convertToEquityProject } from '@/utils/typeConverters';

export const useJobSeekerDashboardCore = (refreshTrigger = 0) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [parsedCvData, setParsedCvData] = useState<any | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [userCVs, setUserCVs] = useState<any[]>([]);

  const loadingRef = useRef(false);

  useEffect(() => {
    const userId = supabase.auth.currentUser?.id;
    if (userId) {
      loadProfileData(userId);
      loadUserCVs(userId);
    }
  }, [refreshTrigger]);

  const loadUserCVs = async (userId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cvs')
        .list(`${userId}/`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error("Error listing CVs:", error);
        return;
      }

      setUserCVs(data || []);
    } catch (error) {
      console.error("Error listing CVs:", error);
    }
  };

  const onCvListUpdated = () => {
    const userId = supabase.auth.currentUser?.id;
    if (userId) {
      loadUserCVs(userId);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      window.location.href = '/auth/seeker';
    }
  };

  const handleCvUpload = async (file: File) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to upload a CV");
      return false;
    }

    const fileName = `${file.name}`;
    const filePath = `${userId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading CV:", uploadError);
        toast.error("Failed to upload CV");
        return false;
      }

      toast.success("CV uploaded successfully");
      loadUserCVs(userId);
      return true;
    } catch (error) {
      console.error("Error uploading CV:", error);
      toast.error("Failed to upload CV");
      return false;
    }
  };

  const handleProfileUpdate = async (data: any) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to update your profile");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        toast.error("Failed to update profile");
        return false;
      }

      toast.success("Profile updated successfully");
      loadProfileData(userId);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return false;
    }
  };

  const handleSkillsUpdate = async (skills: Skill[]) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to update your skills");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ skills: skills })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating skills:", updateError);
        toast.error("Failed to update skills");
        return false;
      }

      toast.success("Skills updated successfully");
      setSkills(skills);
      return true;
    } catch (error) {
      console.error("Error updating skills:", error);
      toast.error("Failed to update skills");
      return false;
    }
  };

  const refreshApplications = async () => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to refresh applications");
      return;
    }

    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*, business_roles:project_sub_tasks!job_applications_task_id_fkey(*)')
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      // Convert job applications
      const convertedApplications = (applicationsData || []).map(convertToJobApplication);
      setApplications(convertedApplications);

      toast.success("Applications refreshed successfully");
    } catch (error) {
      console.error("Error refreshing applications:", error);
      toast.error("Failed to refresh applications");
    }
  };

  const handleAcceptJob = async (jobAppId: string) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to accept a job");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ accepted_jobseeker: true })
        .eq('job_app_id', jobAppId);

      if (updateError) {
        console.error("Error accepting job:", updateError);
        toast.error("Failed to accept job");
        return false;
      }

      toast.success("Job accepted successfully");
      refreshApplications();
      return true;
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
      return false;
    }
  };

  const handleWithdrawApplication = async (jobAppId: string, reason?: string) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to withdraw an application");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn', message: reason })
        .eq('job_app_id', jobAppId);

      if (updateError) {
        console.error("Error withdrawing application:", updateError);
        toast.error("Failed to withdraw application");
        return false;
      }

      toast.success("Application withdrawn successfully");
      refreshApplications();
      return true;
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
      return false;
    }
  };

  const handleLogEffort = async (effort: any) => {
    const userId = supabase.auth.currentUser?.id;
    if (!userId) {
      toast.error("You must be logged in to log effort");
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('effort_logs')
        .insert([
          {
            job_app_id: effort.jobAppId,
            task_id: effort.taskId,
            user_id: userId,
            hours: effort.hours,
            description: effort.description,
            date: effort.date.toISOString()
          }
        ]);

      if (insertError) {
        console.error("Error logging effort:", insertError);
        toast.error("Failed to log effort");
        return false;
      }

      toast.success("Effort logged successfully");
      return true;
    } catch (error) {
      console.error("Error logging effort:", error);
      toast.error("Failed to log effort");
      return false;
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    console.log(`Handling action ${action} for ticket ${ticketId} with data:`, data);
    try {
      if (action === 'startTask') {
        const { error } = await supabase
          .from('tickets')
          .update({ status: 'in_progress' })
          .eq('id', ticketId);

        if (error) throw error;
        toast.success('Task marked as In Progress');
      } else if (action === 'submitForReview') {
        const { error } = await supabase
          .from('tickets')
          .update({ status: 'review', completion_percentage: 100 })
          .eq('id', ticketId);

        if (error) throw error;
        toast.success('Task submitted for review');
      } else if (action === 'markComplete') {
        const { error } = await supabase
          .from('tickets')
          .update({ status: 'done' })
          .eq('id', ticketId);

        if (error) throw error;
        toast.success('Task marked as Complete');
      } else if (action === 'logTime') {
        // Placeholder for logging time
        toast.info('Time logged successfully (placeholder)');
      } else {
        console.warn(`Unknown action: ${action}`);
        toast.warning(`Unknown action: ${action}`);
        return;
      }
    } catch (error: any) {
      console.error(`Error performing action ${action}:`, error.message);
      toast.error(`Failed to perform action: ${action}`);
    }
  };

  // Update the function to use our type converters
  const loadProfileData = async (userId: string) => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    
    try {
      console.log("Loading profile data for user:", userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Process skills with the converter
      const userSkills = profileData?.skills ? 
        (Array.isArray(profileData.skills) ? profileData.skills : (profileData.skills as any).map(convertToSkill)) : 
        [];

      // Set states with processed data
      setProfile(profileData || null);
      setSkills(userSkills);
      
      // Load CV URL safely
      setCvUrl(profileData?.cv_url || null);
      
      // Check if this user also has a business profile
      const { data: businessData } = await supabase
        .from('businesses')
        .select('businesses_id')
        .eq('businesses_id', userId)
        .maybeSingle();
      
      setHasBusinessProfile(!!businessData);
      
      // Load applications and convert them
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*, business_roles:project_sub_tasks!job_applications_task_id_fkey(*)')
        .eq('user_id', userId);
      
      if (applicationsError) throw applicationsError;
      
      // Convert job applications
      const convertedApplications = (applicationsData || []).map(convertToJobApplication);
      setApplications(convertedApplications);
      
      // Load equity projects and convert them
      const { data: equityData, error: equityError } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', userId);
      
      if (equityError) throw equityError;
      
      // Convert equity projects
      const convertedProjects = (equityData || []).map(item => convertToEquityProject({
        id: item.project_id,
        project_id: item.project_id,
        equity_amount: item.equity_agreed,
        time_allocated: null,
        status: item.project_status,
        start_date: item.date_accepted,
        effort_logs: [],
        total_hours_logged: item.total_hours_logged || 0,
        title: item.ticket_title || item.project_title || "Unknown Project",
        created_by: null,
        updated_at: item.ticket_updated_at,
        skill_match: 0,
        sub_tasks: [],
        business_roles: {}
      }));
      
      setEquityProjects(convertedProjects);
      
      // Load opportunities with matching
      const { data: opportunityData, error: opportunityError } = await supabase
        .from('business_projects')
        .select(`
          *,
          sub_tasks:project_sub_tasks(*)
        `)
        .eq('status', 'active');
      
      if (opportunityError) throw opportunityError;
      
      setAvailableOpportunities(opportunityData || []);
      
      // Load CV parsed data
      const { data: cvData } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', userId)
        .order('cv_upload_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (cvData) {
        setParsedCvData({
          skills: cvData.skills || [],
          education: cvData.education || [],
          careerHistory: cvData.career_history || []
        });
      }
      
      setIsProfileComplete(
        !!profileData?.first_name &&
        !!profileData?.last_name &&
        !!(profileData?.skills && profileData.skills.length > 0)
      );
      
    } catch (error: any) {
      console.error("Error loading profile data:", error.message);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  return {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    skills,
    parsedCvData,
    isProfileComplete,
    hasBusinessProfile,
    userCVs,
    handleSignOut,
    handleCvUpload,
    handleProfileUpdate,
    handleSkillsUpdate,
    refreshApplications,
    handleAcceptJob,
    handleWithdrawApplication,
    handleLogEffort,
    handleTicketAction,
    onCvListUpdated
  };
};
