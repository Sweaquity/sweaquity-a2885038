import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfile } from "../useProfile";
import { useApplications } from "../useApplications";
import { useEquityProjects } from "../useEquityProjects";
import { useCVData } from "../useCVData";
import { useSessionCheck } from "./useSessionCheck";
import { useOpportunitiesLoader } from "./useOpportunitiesLoader";
import { useTicketsAndMessages } from "./useTicketsAndMessages";
import { EquityProject } from "@/types/jobSeeker";

export const useJobSeekerDashboardCore = (refreshTrigger = 0) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availableOpportunities, setAvailableOpportunities] = useState<EquityProject[]>([]);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const loadingRef = useRef(false);
  const logsDisabledRef = useRef(true);

  const { profile, skills, loadProfile, handleSkillsUpdate } = useProfile();
  const { applications, loadApplications } = useApplications();
  const { equityProjects, setEquityProjects, logEffort, setLogEffort, transformToEquityProjects } = useEquityProjects();
  const { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData, userCVs, setUserCVs } = useCVData();
  const { checkSession, checkProfileCompletion, checkBusinessProfile, handleSignOut } = useSessionCheck();
  const { loadOpportunities } = useOpportunitiesLoader();
  const { userTickets, ticketMessages, loadUserTickets, handleTicketAction } = useTicketsAndMessages();

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

      const isComplete = await checkProfileCompletion(session.user.id);
      setIsProfileComplete(isComplete);
      
      if (!isComplete) {
        navigate('/seeker/profile/complete');
        loadingRef.current = false;
        return;
      }

      const hasProfile = await checkBusinessProfile(session.user.id);
      setHasBusinessProfile(hasProfile);

      await Promise.all([
        loadProfile(session.user.id),
        loadApplications(session.user.id),
        loadCVData(session.user.id),
        loadUserTickets(session.user.id)
      ]);

      // Convert skills to the format expected by loadOpportunities if needed
      const skillsForOpportunities = skills ? skills.map(s => {
        if ('skill' in s) return { ...s }; 
        if ('name' in s) return { skill: s.name, level: s.level };
        return s;
      }) : [];
      
      const opportunities = await loadOpportunities(session.user.id, skillsForOpportunities);
      setAvailableOpportunities(opportunities);

      const acceptedProjects = transformToEquityProjects(
        applications.filter(app => app.status === 'accepted')
      );

      setEquityProjects(acceptedProjects);
      setIsSessionChecked(true);

    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [
    checkSession, 
    checkProfileCompletion, 
    checkBusinessProfile, 
    loadProfile, 
    loadApplications, 
    loadCVData, 
    loadUserTickets, 
    loadOpportunities, 
    skills, 
    applications, 
    navigate, 
    transformToEquityProjects
  ]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      logsDisabledRef.current = false;
      
      const timer = setTimeout(() => {
        logsDisabledRef.current = true;
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    loadDashboardData();
    
    const sessionCheckInterval = setInterval(async () => {
      await checkSession();
    }, 300000); // 5 minute interval

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [checkSession, loadDashboardData, refreshTrigger]);

  const signOut = async () => {
    const result = await handleSignOut();
    if (result.success) {
      navigate('/auth/seeker');
    } else {
      toast.error("Failed to sign out");
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

  const onCvListUpdated = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadCVData(session.user.id);
      }
    } catch (error) {
      toast.error("Failed to refresh CV list");
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
    logEffort,
    setLogEffort,
    setCvUrl,
    setParsedCvData,
    setEquityProjects,
    handleSignOut: signOut,
    handleSkillsUpdate,
    refreshApplications,
    hasBusinessProfile,
    isProfileComplete,
    userCVs,
    onCvListUpdated,
    userTickets,
    ticketMessages,
    handleTicketAction
  };
};
