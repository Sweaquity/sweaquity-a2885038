
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
          console.error("Error fetching profile CV URL:", profileError);
        }
      } else if (profileData?.cv_url) {
        setCvUrl(profileData.cv_url);
      }

      // Get parsed CV data if available
      const { data: cvData, error: cvError } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cvError) {
        if (cvError.code !== 'PGRST116') {  // Ignore "no rows returned" error
          console.error("Error fetching CV data:", cvError);
        }
      } else if (cvData) {
        setParsedCvData(cvData);
      }
      
      try {
        // Get list of user's CVs
        const cvFiles = await listUserCVs(userId);
        
        // Mark default CV
        const defaultCVUrl = profileData?.cv_url;
        const filesWithDefault = cvFiles.map(file => ({
          ...file,
          isDefault: defaultCVUrl ? defaultCVUrl.includes(file.name) : false
        }));
        
        setUserCVs(filesWithDefault);
      } catch (error) {
        console.error('Error loading CV list:', error);
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
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
