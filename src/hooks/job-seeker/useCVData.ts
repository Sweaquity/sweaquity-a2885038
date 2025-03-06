
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { listUserCVs } from "@/utils/setupStorage";

export interface CVFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: any;
  isDefault?: boolean;
}

export const useCVData = () => {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [parsedCvData, setParsedCvData] = useState<any>(null);
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCVData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Get user's profile data to check for CV URL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
        
      if (profileError) {
        if (profileError.code !== 'PGRST116') {  // Ignore "no rows returned" error
          toast.error("Error fetching profile data");
        }
      } else if (profileData?.cv_url) {
        setCvUrl(profileData.cv_url);
      } else {
        // Explicitly set to null if no CV URL is found in the profile
        setCvUrl(null);
      }

      // Get parsed CV data if available
      const { data: cvData, error: cvError } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cvError) {
        if (cvError.code !== 'PGRST116') {  // Ignore "no rows returned" error
          toast.error("Error fetching CV data");
        }
      } else if (cvData) {
        setParsedCvData(cvData);
      } else {
        // Explicitly set to null if no parsed data is found
        setParsedCvData(null);
      }
      
      try {
        // Get list of user's CVs
        const cvFiles = await listUserCVs(userId);
        
        // Mark default CV
        const defaultCVUrl = profileData?.cv_url;
        
        // If we have a default CV URL but no files match, we need to clear the default CV
        if (defaultCVUrl && cvFiles.length > 0) {
          const fileName = defaultCVUrl.split('/').pop();
          const fileExists = cvFiles.some(file => file.name === fileName);
          
          if (!fileExists) {
            // The default CV file no longer exists, clear it from the profile
            await supabase
              .from('profiles')
              .update({ cv_url: null })
              .eq('id', userId);
              
            // Also update CV parsed data if it exists
            await supabase
              .from('cv_parsed_data')
              .update({ cv_url: null })
              .eq('user_id', userId);
              
            setCvUrl(null);
          }
        }
        
        const filesWithDefault = cvFiles.map(file => ({
          ...file,
          isDefault: defaultCVUrl ? defaultCVUrl.includes(file.name) : false
        }));
        
        setUserCVs(filesWithDefault);
        
        // If there are no CVs, make sure cvUrl is null
        if (cvFiles.length === 0) {
          setCvUrl(null);
          
          // Also update the profile if needed
          if (profileData?.cv_url) {
            await supabase
              .from('profiles')
              .update({ cv_url: null })
              .eq('id', userId);
              
            // Also update CV parsed data if it exists
            await supabase
              .from('cv_parsed_data')
              .update({ cv_url: null })
              .eq('user_id', userId);
          }
        }
      } catch (error) {
        toast.error('Error loading CV list');
      }
    } catch (error) {
      toast.error("Failed to load CV data");
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    cvUrl, 
    setCvUrl, 
    parsedCvData, 
    setParsedCvData, 
    loadCVData,
    userCVs,
    setUserCVs,
    isLoading
  };
};
