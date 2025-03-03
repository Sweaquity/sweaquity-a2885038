
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfile } from "./job-seeker/useProfile";
import { useApplications } from "./job-seeker/useApplications";
import { useEquityProjects } from "./job-seeker/useEquityProjects";
import { useCVData } from "./job-seeker/useCVData";
import { EquityProject, SubTask, Skill } from "@/types/jobSeeker";

export const useJobSeekerDashboard = (refreshTrigger = 0) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availableOpportunities, setAvailableOpportunities] = useState<EquityProject[]>([]);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  const { profile, skills, loadProfile, handleSkillsUpdate } = useProfile();
  const { applications, pastApplications, loadApplications } = useApplications();
  const { equityProjects, setEquityProjects, logEffort, setLogEffort, transformToEquityProjects } = useEquityProjects();
  const { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData } = useCVData();

  // Check authentication session
  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No active session found, redirecting to login");
      navigate('/auth/seeker');
      return false;
    }
    return session;
  }, [navigate]);

  // Check if profile is complete
  const checkProfileCompletion = useCallback(async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, terms_accepted')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error checking profile:", profileError);
        return false;
      }
      
      const isComplete = !!profileData?.first_name && 
                       !!profileData?.last_name && 
                       !!profileData?.terms_accepted;
      
      setIsProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error("Error in profile completion check:", error);
      return false;
    }
  }, []);

  // Load opportunities based on user skills
  const loadOpportunities = useCallback(async (userId, userSkills) => {
    try {
      // Get user's existing applications
      const { data: userApplications, error: applicationsError } = await supabase
        .from('job_applications')
        .select('task_id, status')
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      // Create set of unavailable task IDs (anything except withdrawn and rejected)
      const unavailableTaskIds = new Set(
        userApplications
          ?.filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
          .map(app => app.task_id) || []
      );

      console.log("Unavailable task IDs:", Array.from(unavailableTaskIds));

      // Format user skills for matching
      const formattedUserSkills = Array.isArray(userSkills) 
        ? userSkills.map(s => typeof s === 'string' ? s : s.skill.toLowerCase())
        : [];

      console.log("User skills:", formattedUserSkills);
      
      // Fetch open tasks from all businesses
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          project:business_projects (
            project_id,
            title,
            business_id,
            business:businesses (
              company_name
            )
          )
        `)
        .eq('status', 'open');

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }
      
      // Filter and format opportunities
      const opportunities = tasksData
        ?.filter(task => {
          // Skip tasks that have already been applied for
          if (unavailableTaskIds.has(task.task_id)) return false;
          
          // If userSkills is empty, include all tasks, otherwise check for matching skills
          if (formattedUserSkills.length === 0) return true;
          
          // Check if the user has any matching skills for this task
          const taskSkills = (task.skills_required || []).map(s => s.toLowerCase());
          const hasMatchingSkill = formattedUserSkills.some(skill => 
            taskSkills.includes(skill.toLowerCase())
          );
          
          return hasMatchingSkill;
        })
        .map(task => {
          // Calculate skill match percentage
          const taskSkills = (task.skills_required || []).map(s => s.toLowerCase());
          const matchingSkills = formattedUserSkills.filter(skill => 
            taskSkills.includes(skill.toLowerCase())
          );
          
          const matchPercentage = taskSkills.length > 0 
            ? Math.round((matchingSkills.length / taskSkills.length) * 100) 
            : 0;

          // Get company name
          const companyName = task.project?.business?.company_name || "Unknown Company";
          
          return {
            id: task.task_id,
            project_id: task.project_id,
            equity_amount: task.equity_allocation,
            time_allocated: task.timeframe,
            status: task.status,
            start_date: task.created_at,
            effort_logs: [],
            total_hours_logged: 0,
            title: task.project?.title || "Untitled Project",
            created_by: task.created_by,
            skill_match: matchPercentage,
            sub_tasks: [{
              id: task.task_id,
              task_id: task.task_id,
              project_id: task.project_id,
              title: task.title,
              description: task.description,
              timeframe: task.timeframe,
              status: task.status,
              equity_allocation: task.equity_allocation,
              skill_requirements: task.skill_requirements || [],
              skills_required: task.skills_required || [],
              task_status: task.task_status,
              completion_percentage: task.completion_percentage
            }],
            business_roles: {
              title: task.title,
              description: task.description,
              project_title: task.project?.title,
              company_name: companyName
            }
          };
        }) || [];

      console.log(`Available opportunities after filtering by skills: ${opportunities.length}`);
      return opportunities;
    } catch (error) {
      console.error("Error loading opportunities:", error);
      return [];
    }
  }, []);

  // Main data loading function
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check session
      const session = await checkSession();
      if (!session) return;

      console.log("Loading profile data for user:", session.user.id);

      // Check profile completion
      const isComplete = await checkProfileCompletion(session.user.id);
      if (!isComplete) {
        console.log("Profile incomplete, redirecting to completion page");
        navigate('/seeker/profile/complete');
        return;
      }

      // Load user data in parallel
      await Promise.all([
        loadProfile(session.user.id),
        loadApplications(session.user.id),
        loadCVData(session.user.id)
      ]);

      // Load opportunities based on skills
      const opportunities = await loadOpportunities(session.user.id, skills);
      setAvailableOpportunities(opportunities);

      // Transform accepted applications to equity projects
      const acceptedProjects = transformToEquityProjects(
        applications.filter(app => app.status === 'accepted')
      );

      // Set equity projects
      setEquityProjects(acceptedProjects);
      setIsSessionChecked(true);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [checkSession, checkProfileCompletion, loadProfile, loadApplications, loadCVData, loadOpportunities, skills, applications, navigate, transformToEquityProjects]);

  // Set up session check and data loading
  useEffect(() => {
    // Set up periodic session checks (especially important for mobile devices)
    const sessionCheckInterval = setInterval(async () => {
      await checkSession();
    }, 60000); // Check every minute

    loadDashboardData();

    // Cleanup interval on component unmount
    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [checkSession, loadDashboardData, refreshTrigger]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate('/auth/seeker');
    }
  };

  const refreshApplications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await loadApplications(session.user.id);
    } catch (error) {
      console.error('Error refreshing applications:', error);
    }
  };

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
    logEffort,
    setLogEffort,
    setCvUrl,
    setParsedCvData,
    setEquityProjects,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications
  };
};
