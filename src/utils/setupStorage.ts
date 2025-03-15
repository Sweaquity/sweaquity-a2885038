
import { supabase } from "@/lib/supabase";

export const setupContractStorage = async () => {
  try {
    // Check if the contracts bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return false;
    }
    
    // Check if contracts bucket exists
    const contractsBucketExists = buckets.some(bucket => bucket.name === 'contracts');
    
    if (!contractsBucketExists) {
      // Create the contracts bucket
      const { error: createError } = await supabase.storage.createBucket('contracts', {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error("Error creating contracts bucket:", createError);
        return false;
      }
      
      console.log("Contracts storage bucket created successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error setting up contract storage:", error);
    return false;
  }
};

// Run the setup function
setupContractStorage();
