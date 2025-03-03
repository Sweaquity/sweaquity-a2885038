import { useState, useEffect, useCallback, useRef } from "react";
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
  const loadingRef = useRef(false);

  const { profile, skills, loadProfile, handleSkillsUpdate } = useProfile();
  const { applications, pastApplications, loadApplications } = useApplications();
  const { equityProjects, setEquityProjects, logEffort, setLogEffort, transformToEquityProjects } = useEquityProjects();
  const { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData } = useCVData();

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        navigate('/auth/seeker');
        return false;
      }
      return session;
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  }, [navigate]);

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

  const loadOpportunities = useCallback(async (userId, userSkills) => {
    try {
      const { data: userApplications, error: applicationsError } = await supabase
        .from('job_applications')
        .select('task_id, status')
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      const unavailableTaskIds = new Set(
        userApplications
          ?.filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
          .map(app => app.task_id) || []
      );

      console.log("Unavailable task IDs:", Array.from(unavailableTaskIds));

      const formattedUserSkills = Array.isArray(userSkills) 
        ? userSkills.map(s => typeof s === 'string' ? s : s.skill.toLowerCase())
        : [];

      console.log("User skills:", formattedUserSkills);
      
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
      
      const opportunities = tasksData
        ?.filter(task => {
          if (unavailableTaskIds.has(task.task_id)) return false;
          
          if (formattedUserSkills.length === 0) return true;
          
          if (!task.skill_requirements || !Array.isArray(task.skill_requirements)) return false;
          
          const taskSkills = task.skill_requirements.map(s => 
            typeof s === 'string' ? s.toLowerCase() : s.skill.toLowerCase()
          );
          
          const hasMatchingSkill = formattedUserSkills.some(skill => 
            taskSkills.includes(skill.toLowerCase())
          );
          
          return hasMatchingSkill;
        })
        .map(task => {
          if (!task.skill_requirements || !Array.isArray(task.skill_requirements)) {
            task.skill_requirements = [];
          }
          
          const taskSkills = task.skill_requirements.map(s => 
            typeof s === 'string' ? s.toLowerCase() : s.skill.toLowerCase()
          );
          
          const matchingSkills = formattedUserSkills.filter(skill => 
            taskSkills.includes(skill.toLowerCase())
          );
          
          const matchPercentage = taskSkills.length > 0 
            ? Math.round((matchingSkills.length / taskSkills.length) * 100) 
            : 0;

          let companyName = "Unknown Company";
          
          if (task.project?.business) {
            if (Array.isArray(task.project.business)) {
              companyName = task.project.business[0]?.company_name || "Unknown Company";
            } else {
              companyName = task.project.business.company_name || "Unknown Company";
            }
          }
          
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

  const loadDashboardData = useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    
    try {
      setIsLoading(true);
      
      const session = await checkSession();
      if (!session) {
        loadingRef.current = false;
        return;
      }

      console.log("Loading profile data for user:", session.user.id);

      const isComplete = await checkProfileCompletion(session.user.id);
      if (!isComplete) {
        console.log("Profile incomplete, redirecting to completion page");
        navigate('/seeker/profile/complete');
        loadingRef.current = false;
        return;
      }

      await Promise.all([
        loadProfile(session.user.id),
        loadApplications(session.user.id),
        loadCVData(session.user.id)
      ]);

      const opportunities = await loadOpportunities(session.user.id, skills);
      setAvailableOpportunities(opportunities);

      const acceptedProjects = transformToEquityProjects(
        applications.filter(app => app.status === 'accepted')
      );

      setEquityProjects(acceptedProjects);
      setIsSessionChecked(true);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [checkSession, checkProfileCompletion, loadProfile, loadApplications, loadCVData, loadOpportunities, skills, applications, navigate, transformToEquityProjects]);

  useEffect(() => {
    if (!loadingRef.current) {
      loadDashboardData();
    }
    
    const sessionCheckInterval = setInterval(async () => {
      await checkSession();
    }, 300000);

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [checkSession, loadDashboardData, refreshTrigger]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out");
      } else {
        navigate('/auth/seeker');
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("An error occurred during sign out");
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
