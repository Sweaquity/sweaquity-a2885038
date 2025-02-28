
import { supabase } from "@/lib/supabase";

export const setupCvStorageBucket = async () => {
  try {
    // Check if the cvs bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return false;
    }
    
    const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
    
    if (!cvsBucketExists) {
      console.log("CV bucket doesn't exist. Will need to use or create it on the server side.");
      // We won't try to create the bucket from the client side as it will fail due to RLS
      // Instead, we should inform the user that they need to create the bucket or their admin needs to
      toast.info("CV storage is being set up. Some features may be unavailable until setup is complete.");
    }
    
    // Retrieve the current user's ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("No authenticated user session");
      return false;
    }
    
    const userId = session.user.id;
    
    // Check if user's folder exists in the bucket
    // Note: We're not trying to create it, just checking if it exists
    let folderExists = false;
    
    try {
      const { data: folderData } = await supabase.storage
        .from('cvs')
        .list(userId);
        
      folderExists = Array.isArray(folderData) && folderData.length > 0;
    } catch (error) {
      console.log("Error checking folder existence:", error);
      // Folder might not exist yet, which is fine
    }
    
    console.log("CV storage setup check completed");
    return cvsBucketExists;
    
  } catch (error) {
    console.error("Error setting up CV bucket:", error);
    return false;
  }
};
