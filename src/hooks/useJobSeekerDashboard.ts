
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

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, title, email, location, skills')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        if (profileData.skills && Array.isArray(profileData.skills)) {
          const convertedSkills: Skill[] = profileData.skills.map((skill: string | Skill) => {
            if (typeof skill === 'string') {
              return { name: skill, level: 'Intermediate' };
            }
            return skill as Skill;
          });
          setSkills(convertedSkills);
        }

        if (!profileData.first_name || !profileData.last_name || !profileData.title) {
          setIsLoading(false);
          return;
        }

        const { data: applicationsData } = await supabase
          .from('job_applications')
          .select(`
            *,
            business_roles (
              title,
              description
            )
          `)
          .eq('user_id', session.user.id);

        if (applicationsData) {
          setApplications(applicationsData);
        }

        const { data: equityData } = await supabase
          .from('sweaquity_matched_live_projects')
          .select(`
            *,
            business_roles (
              title,
              description
            )
          `)
          .eq('user_id', session.user.id);

        if (equityData) {
          setEquityProjects(equityData);
        }

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
    handleSignOut,
    handleSkillsUpdate
  };
};
