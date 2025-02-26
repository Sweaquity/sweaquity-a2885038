
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useCVData = () => {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [parsedCvData, setParsedCvData] = useState<any>(null);

  const loadCVData = async (userId: string) => {
    try {
      const { data: cvData } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cvData) {
        setParsedCvData(cvData);
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
      toast.error("Failed to load CV data");
    }
  };

  return { cvUrl, setCvUrl, parsedCvData, setParsedCvData, loadCVData };
};
