
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export const useSessionCheck = () => {
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/seeker');
        return false;
      }
      return session;
    } catch (error) {
      console.error("Session check error:", error);
      navigate('/auth/seeker');
      return false;
    }
  }, [navigate]);

  const checkProfileCompletion = useCallback(async (userId: string) => {
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
      
      return !!profileData?.first_name && 
             !!profileData?.last_name && 
             !!profileData?.terms_accepted;
    } catch (error) {
      console.error("Error in profile completion check:", error);
      return false;
    }
  }, []);

  const checkBusinessProfile = useCallback(async (userId: string) => {
    try {
      const { data: businessData, error } = await supabase
        .from('businesses')
        .select('businesses_id')
        .eq('businesses_id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Business profile check error:', error);
        return false;
      }
        
      return !!businessData;
    } catch (error) {
      console.error('Business profile check error:', error);
      return false;
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return { success: false, error };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }
  };

  return {
    checkSession,
    checkProfileCompletion,
    checkBusinessProfile,
    handleSignOut
  };
};
