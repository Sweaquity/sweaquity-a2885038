import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Profile, Skill } from "@/types/jobSeeker";
import { parseCv } from "@/utils/parseCv";

// Define a type for the parsed CV data
interface ParsedCvData {
  skills: string[];
  experience: string[];
  education: string[];
}

// Define a type for the CV file
interface CVFile {
  name: string;
  url: string;
}

// Add a helper function to handle skills properly
const formatSkill = (skill: any) => {
  if (typeof skill === 'string') {
    return { skill, level: 'Intermediate' }; // Default level if string
  }
  if (skill && typeof skill === 'object') {
    return {
      skill: skill.skill || skill.name || '',
      level: skill.level || 'Intermediate'
    };
  }
  return { skill: '', level: 'Intermediate' };
};

export const useJobSeekerDashboardCore = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [equityProjects, setEquityProjects] = useState<any[]>([]);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [parsedCvData, setParsedCvData] = useState<ParsedCvData>({
    skills: [],
    experience: [],
    education: [],
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          if (profileData) {
            setProfile(profileData);
            setSkills(profileData.skills || []);
          }

          // Fetch CV URL
          const { data: cvData, error: cvError } = await supabase
            .from('cv_uploads')
            .select('file_url')
            .eq('user_id', user.id)
            .order('uploaded_at', { ascending: false })
            .limit(1)
            .single();

          if (cvError) {
            console.error("Error fetching CV URL:", cvError);
          } else if (cvData) {
            setCvUrl(cvData.file_url);
          }

          // Fetch applications
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('user_id', user.id);

          if (applicationsError) throw applicationsError;
          setApplications(applicationsData || []);

          // Fetch equity projects
          const { data: equityProjectsData, error: equityProjectsError } = await supabase
            .from('equity_projects')
            .select('*')
            .eq('user_id', user.id);

          if (equityProjectsError) throw equityProjectsError;
          setEquityProjects(equityProjectsData || []);

          // Fetch available opportunities
          const { data: availableOpportunitiesData, error: availableOpportunitiesError } = await supabase
            .from('available_opportunities')
            .select('*')
            .eq('user_id', user.id);

          if (availableOpportunitiesError) throw availableOpportunitiesError;
          setAvailableOpportunities(availableOpportunitiesData || []);

          // Check if the user has a business profile
          const { data: businessProfile, error: businessProfileError } = await supabase
            .from('businesses')
            .select('businesses_id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (businessProfileError) {
            console.error("Error checking business profile:", businessProfileError);
          } else {
            setHasBusinessProfile(!!businessProfile);
          }

          // Fetch user CVs
          const { data: cvList, error: cvListError } = await supabase
            .from('cv_uploads')
            .select('file_name, file_url')
            .eq('user_id', user.id)
            .order('uploaded_at', { ascending: false });

          if (cvListError) {
            console.error("Error fetching CV list:", cvListError);
          } else {
            setUserCVs(cvList ? cvList.map(cv => ({ name: cv.file_name, url: cv.file_url })) : []);
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const parseCVData = async () => {
      if (cvUrl) {
        try {
          const parsedData = await parseCv(cvUrl);
          setParsedCvData(parsedData);
        } catch (error) {
          console.error("Error parsing CV:", error);
          toast.error("Failed to parse CV data");
        }
      }
    };

    parseCVData();
  }, [cvUrl]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleSkillsUpdate = async (newSkills: Skill[]) => {
    try {
      if (!profile) return;
      
      const formattedSkills = newSkills.map(formatSkill);
      
      const { error } = await supabase
        .from('profiles')
        .update({ skills: formattedSkills })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setSkills(formattedSkills);
      toast.success("Skills updated successfully");
    } catch (error) {
      console.error("Error updating skills:", error);
      toast.error("Failed to update skills");
    }
  };

  const refreshApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', user.id);

        if (applicationsError) throw applicationsError;
        setApplications(applicationsData || []);
      }
    } catch (error) {
      console.error("Error refreshing applications:", error);
      toast.error("Failed to refresh applications");
    }
  };

  const onCvListUpdated = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cvList, error: cvListError } = await supabase
        .from('cv_uploads')
        .select('file_name, file_url')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (cvListError) {
        console.error("Error fetching CV list:", cvListError);
        toast.error("Failed to refresh CV list");
      } else {
        setUserCVs(cvList ? cvList.map(cv => ({ name: cv.file_name, url: cv.file_url })) : []);
      }
    } catch (error) {
      console.error("Error updating CV list:", error);
      toast.error("Failed to update CV list");
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus':
          await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          toast.success("Status updated");
          break;
        
        case 'updatePriority':
          await supabase
            .from('tickets')
            .update({ priority: data })
            .eq('id', ticketId);
          
          toast.success("Priority updated");
          break;
        
        case 'updateDueDate':
          await supabase
            .from('tickets')
            .update({ due_date: data })
            .eq('id', ticketId);
          
          toast.success("Due date updated");
          break;
        
        case 'addNote':
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', profile?.id)
            .single();
          
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
            'User';
          
          const newNote = {
            id: Date.now().toString(),
            user: userName,
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          await supabase
            .from('tickets')
            .update({ notes: updatedNotes })
            .eq('id', ticketId);
          
          toast.success("Note added");
          break;
        
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  return {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    parsedCvData,
    skills,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications,
    hasBusinessProfile,
    userCVs,
    onCvListUpdated,
    handleTicketAction
  };
};
