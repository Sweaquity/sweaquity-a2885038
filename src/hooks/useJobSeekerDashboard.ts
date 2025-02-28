
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { JobApplication, EquityProject, Profile, Skill } from "@/types/jobSeeker";
import { useCVData, CVFile } from "./job-seeker/useCVData";
import { useProfile } from "./job-seeker/useProfile";
import { useApplications } from "./job-seeker/useApplications";
import { useEquityProjects } from "./job-seeker/useEquityProjects";

export const useJobSeekerDashboard = (refreshTrigger = 0) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [pastApplications, setPastApplications] = useState<JobApplication[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);

  const { profile, loadProfile } = useProfile();
  const { applications, loadApplications } = useApplications();
  const { equityProjects, loadEquityProjects } = useEquityProjects();
  const { cvUrl, parsedCvData, loadCVData, userCVs: cvFiles, loadCVs } = useCVData();

  const refreshCVs = useCallback(async () => {
    if (userId) {
      await loadCVs(userId);
    }
  }, [userId, loadCVs]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth/seeker');
        return;
      }
      
      const currentUserId = session.user.id;
      setUserId(currentUserId);
      
      // Load profile data
      await loadProfile(currentUserId);
      
      // Load CV data
      await loadCVData(currentUserId);
      
      // Load user CVs
      await loadCVs(currentUserId);
      
      // Load applications
      await loadApplications(currentUserId);
      
      // Load equity projects
      await loadEquityProjects(currentUserId);
      
      // Load available opportunities
      await loadAvailableOpportunities(currentUserId);
      
      // Extract skills from CV data
      if (parsedCvData?.skills) {
        let extractedSkills: Skill[] = [];
        try {
          if (typeof parsedCvData.skills === 'string') {
            extractedSkills = JSON.parse(parsedCvData.skills);
          } else if (Array.isArray(parsedCvData.skills)) {
            extractedSkills = parsedCvData.skills.map(s => 
              typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
            );
          }
          setSkills(extractedSkills);
        } catch (e) {
          console.error("Error parsing skills:", e);
        }
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile, loadCVData, loadApplications, loadEquityProjects, navigate, parsedCvData, loadCVs]);

  // Helper function to load available opportunities
  const loadAvailableOpportunities = async (userId: string) => {
    try {
      // First, get a list of tasks user has already applied to
      const { data: userApplications, error: applicationError } = await supabase
        .from('job_applications')
        .select('task_id')
        .eq('user_id', userId);
        
      if (applicationError) throw applicationError;
      
      // Get all available tasks that are 'open'
      const { data: availableTasks, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          business_projects:project_id (
            title, 
            business_id,
            businesses:business_id (
              company_name
            )
          )
        `)
        .eq('status', 'open');
        
      if (taskError) throw taskError;
      
      // Filter out tasks that user has already applied to
      const appliedTaskIds = userApplications?.map(app => app.task_id) || [];
      
      const filteredTasks = availableTasks?.filter(task => 
        !appliedTaskIds.includes(task.id)
      ) || [];
      
      setAvailableOpportunities(filteredTasks);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth/seeker');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  const handleSkillsUpdate = async (updatedSkills: Skill[]) => {
    try {
      if (!userId) return;
      
      // Update skills in the database
      const { error } = await supabase
        .from('profiles')
        .update({ skills: updatedSkills })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Also update in CV parsed data if it exists
      const { error: cvError } = await supabase
        .from('cv_parsed_data')
        .update({ skills: updatedSkills })
        .eq('user_id', userId);
        
      if (cvError && cvError.code !== 'PGRST116') {
        console.warn("Error updating CV data:", cvError);
      }
      
      // Update local state
      setSkills(updatedSkills);
      toast.success("Skills updated successfully");
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error("Failed to update skills");
    }
  };

  const refreshApplications = useCallback(async () => {
    if (userId) {
      await loadApplications(userId);
    }
  }, [userId, loadApplications]);

  // Load data on component mount and when refresh trigger changes
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Listen for auth state changes
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth/seeker');
      }
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    pastApplications, 
    parsedCvData,
    skills,
    userCVs: cvFiles,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications,
    refreshCVs
  };
};
