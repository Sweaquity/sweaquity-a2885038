
import { supabase } from "@/lib/supabase";

export const setupCvStorageBucket = async () => {
  try {
    // Check if the cvs bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
    
    if (!cvsBucketExists) {
      console.log("Creating cvs bucket");
      // Create the bucket with public access
      const { error: createError } = await supabase.storage.createBucket('cvs', {
        public: true
      });
      
      if (createError) {
        console.error("Error creating cvs bucket:", createError);
        return false;
      }
      
      console.log("CV bucket created successfully");
    }
    
    // Set up appropriate RLS policies for the bucket
    // This will allow users to manage their own files
    
    // Retrieve the current user's ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("No authenticated user session");
      return false;
    }
    
    const userId = session.user.id;
    
    // Try to create user's folder if it doesn't exist
    try {
      await supabase.storage.from('cvs').upload(`${userId}/.folder`, new Blob(['']));
    } catch (error) {
      // Folder might already exist, which is fine
      console.log("Folder creation attempt:", error);
    }
    
    console.log("CV storage bucket setup completed");
    return true;
  } catch (error) {
    console.error("Error setting up CV bucket:", error);
    return false;
  }
};
