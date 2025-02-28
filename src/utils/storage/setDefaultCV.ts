
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const setDefaultCV = async (userId: string, fileName: string) => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { data: urlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);
      
    if (!urlData?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }
    
    // Update the profile with the new default CV URL
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ cv_url: urlData.publicUrl })
      .eq('id', userId);
      
    if (profileError) {
      throw profileError;
    }
    
    // Update the cv_parsed_data table as well if it exists
    const { data: cvParseData } = await supabase
      .from('cv_parsed_data')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (cvParseData) {
      await supabase
        .from('cv_parsed_data')
        .update({ cv_url: urlData.publicUrl })
        .eq('user_id', userId);
    }
    
    toast.success("Default CV updated successfully");
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error setting default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};
