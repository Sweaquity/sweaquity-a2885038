
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfile } from "./job-seeker/useProfile";
import { useApplications } from "./job-seeker/useApplications";
import { useEquityProjects } from "./job-seeker/useEquityProjects";
import { useCVData } from "./job-seeker/useCVData";

export const useJobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
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

        // Fetch open tasks for opportunities
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select(`
            *,
            project:business_projects (
              title,
              business:businesses (
                company_name
              )
            )
          `)
          .eq('status', 'open');

        if (tasksError) throw tasksError;

        // Filter out tasks that already have active applications
        const appliedTaskIds = applications
          .filter(app => app.status !== 'withdrawn')
          .map(app => app.task_id);
        
        const availableOpportunities = tasksData
          .filter(task => !appliedTaskIds.includes(task.id))
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
            }]
          }));

        // Transform accepted applications to equity projects
        const acceptedProjects = transformToEquityProjects(
          applications.filter(app => app.status === 'accepted')
        );

        // Set equity projects (only accepted applications)
        setEquityProjects(acceptedProjects);

        // Set available opportunities separately
        setEquityProjects(prevProjects => {
          // Filter out any opportunities that are now accepted projects
          const acceptedProjectIds = acceptedProjects.map(p => p.id);
          const currentOpportunities = prevProjects
            .filter(p => !acceptedProjectIds.includes(p.id))
            .concat(availableOpportunities);
          
          return [...acceptedProjects, ...currentOpportunities];
        });

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
