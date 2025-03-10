
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CVFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size?: number;
  is_default?: boolean;
}

export interface ParsedCVData {
  skills: any[];
  career_history: any[];
  education: any[];
}

export const useCVData = () => {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [parsedCvData, setParsedCvData] = useState<ParsedCVData>({
    skills: [],
    career_history: [],
    education: []
  });
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCVData = async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Fetch the user's profile to get their CV URL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile CV URL:", profileError);
      } else if (profileData?.cv_url) {
        setCvUrl(profileData.cv_url);
      }

      // Fetch parsed CV data
      const { data: parsedData, error: parsedError } = await supabase
        .from('cv_parsed_data')
        .select('skills, career_history, education')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (parsedError && parsedError.code !== 'PGRST116') {
        console.error("Error fetching parsed CV data:", parsedError);
      } else if (parsedData) {
        setParsedCvData({
          skills: parsedData.skills || [],
          career_history: parsedData.career_history || [],
          education: parsedData.education || []
        });
      }

      // Fetch the user's CV files
      const { data: cvFiles, error: cvFilesError } = await supabase
        .storage
        .from('cvs')
        .list(`${userId}`);

      if (cvFilesError) {
        console.error("Error fetching CV files:", cvFilesError);
        return;
      }

      // Transform the data to include full URLs
      if (cvFiles && cvFiles.length > 0) {
        const transformedCVs: CVFile[] = await Promise.all(
          cvFiles.map(async (file) => {
            const { data: urlData } = await supabase
              .storage
              .from('cvs')
              .createSignedUrl(`${userId}/${file.name}`, 60 * 60); // 1 hour expiry

            return {
              id: `${userId}_${file.name}`,
              name: file.name,
              url: urlData?.signedUrl || '',
              created_at: file.created_at || new Date().toISOString(),
              size: file.metadata?.size,
              is_default: profileData?.cv_url?.includes(file.name) || false
            };
          })
        );

        console.info("CV files loaded:", transformedCVs.length);
        setUserCVs(transformedCVs);
        console.info("Setting userCVs:", transformedCVs.length);
      } else {
        // If no files were found, set an empty array and don't log repeatedly
        if (userCVs.length !== 0) {
          console.info("CV files loaded: 0");
          setUserCVs([]);
          console.info("Setting userCVs: 0");
        }
      }
    } catch (error) {
      console.error("Error loading CV data:", error);
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
