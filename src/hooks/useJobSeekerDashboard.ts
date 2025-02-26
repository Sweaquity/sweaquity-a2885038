
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfile } from "./job-seeker/useProfile";
import { useApplications } from "./job-seeker/useApplications";
import { useEquityProjects } from "./job-seeker/useEquityProjects";
import { useCVData } from "./job-seeker/useCVData";
import { EquityProject } from "@/types/jobSeeker";

export const useJobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availableOpportunities, setAvailableOpportunities] = useState<EquityProject[]>([]);
  
  const { profile, skills, loadProfile, handleSkillsUpdate } = useProfile();
  const { applications, pastApplications, loadApplications } = useApplications();
  const { equityProjects, setEquityProjects, logEffort, setLogEffort, transformToEquityProjects } = useEquityProjects();
  const { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData } = useCVData();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/seeker');
          return;
        }

        await Promise.all([
          loadProfile(session.user.id),
          loadApplications(session.user.id),
          loadCVData(session.user.id)
        ]);

        // First, get the user's applications to check what they've already applied for
        const { data: userApplications, error: applicationsError } = await supabase
          .from('job_applications')
          .select('task_id')
          .eq('user_id', session.user.id);

        if (applicationsError) throw applicationsError;

        // Get the IDs of tasks they've already applied for
        const appliedTaskIds = new Set(userApplications.map(app => app.task_id));

        // Fetch open tasks for opportunities that haven't been applied to
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
        
        // Filter out tasks that have already been applied for
        const opportunities = tasksData
          .filter(task => !appliedTaskIds.has(task.id))
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
          }));

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
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate('/auth/seeker');
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
    handleSkillsUpdate
  };
};
