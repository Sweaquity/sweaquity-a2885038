
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfile } from "./job-seeker/useProfile";
import { useApplications } from "./job-seeker/useApplications";
import { useEquityProjects } from "./job-seeker/useEquityProjects";
import { useCVData } from "./job-seeker/useCVData";
import { EquityProject } from "@/types/jobSeeker";

export const useJobSeekerDashboard = (refreshTrigger = 0) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availableOpportunities, setAvailableOpportunities] = useState<EquityProject[]>([]);
  
  const { profile, skills, loadProfile, handleSkillsUpdate } = useProfile();
  const { applications, pastApplications, loadApplications } = useApplications();
  const { equityProjects, setEquityProjects, logEffort, setLogEffort, transformToEquityProjects } = useEquityProjects();
  const { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData, userCVs, setUserCVs } = useCVData();

  useEffect(() => {
    // Define a function to check authentication periodically (useful for mobile)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        navigate('/auth/seeker');
        return false;
      }
      return true;
    };

    // Set up periodic session checks (especially important for mobile devices)
    const sessionCheckInterval = setInterval(async () => {
      await checkSession();
    }, 60000); // Check every minute

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Initial session check
        const hasSession = await checkSession();
        if (!hasSession) return;

        const { data: { session } } = await supabase.auth.getSession();
        console.log("Loading profile data for user:", session.user.id);

        // Load user's profile, applications, and CV data
        await Promise.all([
          loadProfile(session.user.id),
          loadApplications(session.user.id),
          loadCVData(session.user.id)
        ]);

        // After loading profile, check if it's complete
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, terms_accepted')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking profile:", profileError);
        } else if (!profileData?.first_name || !profileData?.last_name || !profileData?.terms_accepted) {
          console.log("Profile incomplete, redirecting to completion page");
          navigate('/seeker/profile/complete');
          return;
        }

        // Get user's existing applications
        const { data: userApplications, error: applicationsError } = await supabase
          .from('job_applications')
          .select('task_id, status')
          .eq('user_id', session.user.id);

        if (applicationsError) throw applicationsError;

        // Create map of task IDs to application status
        const applicationStatusMap = new Map();
        userApplications?.forEach(app => {
          applicationStatusMap.set(app.task_id, app.status);
        });

        // Get task IDs that are not available (anything except withdrawn and rejected)
        const unavailableTaskIds = new Set(
          userApplications
            ?.filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
            .map(app => app.task_id) || []
        );

        console.log("Unavailable task IDs:", Array.from(unavailableTaskIds));

        // Fetch ALL open tasks from ALL businesses
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select(`
            *,
            project:business_projects (
              id,
              title,
              business:businesses (
                company_name
              )
            )
          `)
          .eq('status', 'open');

        if (tasksError) throw tasksError;
        
        console.log("All tasks:", tasksData);
        
        // Filter out tasks that have already been applied for and are not withdrawn/rejected
        const opportunities = tasksData
          ?.filter(task => !unavailableTaskIds.has(task.id))
          .map(task => ({
            id: task.id,
            project_id: task.project_id,
            equity_amount: task.equity_allocation,
            time_allocated: task.timeframe,
            status: task.status,
            start_date: task.created_at,
            effort_logs: [],
            total_hours_logged: 0,
            title: task.title,
            sub_tasks: [{
              id: task.id,
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
              company_name: task.project?.business?.company_name
            }
          })) || [];

        console.log("Available opportunities:", opportunities);
        setAvailableOpportunities(opportunities);

        // Transform accepted applications to equity projects
        const acceptedProjects = transformToEquityProjects(
          applications.filter(app => app.status === 'accepted')
        );

        // Set equity projects to ONLY accepted projects
        setEquityProjects(acceptedProjects);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // Cleanup interval on component unmount
    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [navigate, refreshTrigger]);

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
    userCVs,
    setUserCVs,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications
  };
};
