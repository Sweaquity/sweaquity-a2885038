import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const listUserCVs = async (userId: string) => {
  try {
    // Check if the bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('cvs');
    
    if (bucketError) {
      console.error("Error checking bucket status:", bucketError);
      return [];
    }
    
    // List files in the user's folder
    const { data, error } = await supabase.storage
      .from('cvs')
      .list(userId);
      
    if (error) {
      console.error("Error listing files:", error);
      return [];
    }
    
    // Filter out folder objects, keep only files
    return data?.filter(item => item.name !== '.folder') || [];
    
  } catch (error) {
    console.error("Error listing user CVs:", error);
    toast.error("Failed to retrieve CV list");
    return [];
  }
};
