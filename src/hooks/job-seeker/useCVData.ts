
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useCVData = () => {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [parsedCvData, setParsedCvData] = useState<any>(null);

  const loadCVData = async (userId: string) => {
    try {
      // First, check if the cvs bucket exists, and if not, try to create it
      const { data: buckets } = await supabase.storage.listBuckets();
      const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
      
      if (!cvsBucketExists) {
        console.log("CV storage bucket doesn't exist, this is expected since it should be created by an admin");
      }
      
      // Get user's profile data to check for CV URL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
        
      if (profileError) {
        console.error("Error fetching profile CV URL:", profileError);
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
        console.error("Error fetching CV data:", cvError);
      } else if (cvData) {
        setParsedCvData(cvData);
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
      toast.error("Failed to load CV data");
    }
  };

  return { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData };
};
