
import { supabase } from "@/lib/supabase";

export const setupCvStorageBucket = async () => {
  try {
    // Check if the cvs bucket exists - don't try to create it from client side anymore
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
