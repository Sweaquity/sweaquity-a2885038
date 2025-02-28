
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
  const [bucketReady, setBucketReady] = useState(false);

  // Check if the CV storage bucket exists
  const checkBucketExists = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket('cvs');
      
      if (error) {
        console.error("Error checking CV bucket:", error);
        return false;
      }
      
      return data !== null;
    } catch (error) {
      console.error("Error checking bucket status:", error);
      return false;
    }
  };

  const loadCVData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // First, check if CV bucket exists
      const bucketExists = await checkBucketExists();
      setBucketReady(bucketExists);
      
      if (!bucketExists) {
        console.log("CV storage bucket not accessible or doesn't exist");
        return;
      }
      
      // Get user's profile data to check for CV URL
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('cv_url')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) {
          if (error.code !== 'PGRST116' && error.code !== '42703') {
            // Only log errors that aren't "no rows returned" or "column does not exist"
            console.error("Error fetching profile CV URL:", error);
          }
        } else if (profileData?.cv_url) {
          setCvUrl(profileData.cv_url);
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      }

      // Get parsed CV data if available
      try {
        const { data: cvData, error: cvError } = await supabase
          .from('cv_parsed_data')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (cvError) {
          if (cvError.code !== 'PGRST116') {
            // Only log errors that aren't "no rows returned"
            console.error("Error fetching CV data:", cvError);
          }
        } else if (cvData) {
          setParsedCvData(cvData);
        }
      } catch (error) {
        console.log("Error fetching CV data:", error);
      }
      
      // Get list of user's CVs
      if (bucketExists) {
        try {
          const cvFiles = await listUserCVs(userId);
          
          // Mark default CV
          const defaultCVUrl = cvUrl;
          const filesWithDefault = cvFiles.map(file => ({
            ...file,
            isDefault: defaultCVUrl ? defaultCVUrl.includes(file.name) : false
          }));
          
          setUserCVs(filesWithDefault);
        } catch (error) {
          console.log("Error listing CVs:", error);
        }
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
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
    isLoading,
    bucketReady,
    checkBucketExists
  };
};
