
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const deleteCV = async (userId: string, fileName: string) => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { error } = await supabase.storage
      .from('cvs')
      .remove([filePath]);
      
    if (error) {
      throw error;
    }
    
    // Check if this was the default CV and update profile if needed
    const { data: profileData } = await supabase
      .from('profiles')
      .select('cv_url')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileData?.cv_url) {
      const cvUrl = profileData.cv_url;
      // If the URL contains the filename that was deleted, clear the default CV
      if (cvUrl.includes(fileName)) {
        await supabase
          .from('profiles')
          .update({ cv_url: null })
          .eq('id', userId);
      }
    }
    
    toast.success("CV deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting CV:", error);
    toast.error("Failed to delete CV");
    return false;
  }
};
