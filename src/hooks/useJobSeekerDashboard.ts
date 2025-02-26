
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Profile, JobApplication, EquityProject, Skill } from "@/types/jobSeeker";

export const useJobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [parsedCvData, setParsedCvData] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [logEffort, setLogEffort] = useState({
    projectId: '',
    hours: 0,
    description: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/seeker');
          return;
        }

        // Fetch profile and skills
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, title, email, location, skills')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        if (profileData.skills && Array.isArray(profileData.skills)) {
          const convertedSkills: Skill[] = profileData.skills.map((skill: any) => {
            if (typeof skill === 'string') {
              return { skill: skill, level: 'Intermediate' };
            }
            if ('name' in skill) {
              return { skill: skill.name, level: skill.level };
            }
            return skill as Skill;
          });
          setSkills(convertedSkills);
        }

        // Fetch all available sub-tasks for matching
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('status', 'open');

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          throw tasksError;
        }

        // Convert tasks to equity projects format
        const convertedProjects: EquityProject[] = tasksData.map(task => ({
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

        console.log('Fetched and converted tasks:', convertedProjects);
        setEquityProjects(convertedProjects);

        // Fetch user's applications
        const { data: applicationsData } = await supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', session.user.id);

        if (applicationsData) {
          setApplications(applicationsData);
        }

        // Fetch parsed CV data
        const { data: cvData } = await supabase
          .from('cv_parsed_data')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (cvData) {
          setParsedCvData(cvData);
        }
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

  const handleSkillsUpdate = async (updatedSkills: Skill[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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

      setSkills(updatedSkills);
      toast.success("Skills updated successfully");
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error("Failed to update skills");
    }
  };

  return {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
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
