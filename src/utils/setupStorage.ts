import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
      // Instead, we inform the user that they need to wait for setup to complete
      toast.info("CV storage is being set up. Some features may be unavailable until setup is complete.");
    }
    
    return cvsBucketExists;
    
  } catch (error) {
    console.error("Error setting up CV bucket:", error);
    return false;
  }
};

export const listUserCVs = async (userId: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .list(userId);
      
    if (error) {
      if (error.message.includes("The resource was not found")) {
        // This might happen if the user folder doesn't exist yet
        console.log("User folder not found in CV storage, it will be created on first upload");
        return [];
      }
      throw error;
    }
    
    // Filter out folder objects, keep only files
    return data?.filter(item => !item.id.endsWith('/')) || [];
    
  } catch (error) {
    console.error("Error listing user CVs:", error);
    if (!(error as any).message?.includes("The resource was not found")) {
      toast.error("Failed to retrieve CV list");
    }
    return [];
  }
};

export const downloadCV = async (userId: string, fileName: string) => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('cvs')
      .download(filePath);
      
    if (error) {
      throw error;
    }
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(data);
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error downloading CV:", error);
    toast.error("Failed to download CV");
    return false;
  }
};

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
    try {
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
    } catch (error) {
      console.error("Error updating profile after CV deletion:", error);
      // Continue even if update fails
    }
    
    toast.success("CV deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting CV:", error);
    toast.error("Failed to delete CV");
    return false;
  }
};

export const previewCV = async (userId: string, fileName: string) => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { data } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);
      
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error previewing CV:", error);
    toast.error("Failed to preview CV");
    return false;
  }
};

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
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ cv_url: urlData.publicUrl })
        .eq('id', userId);
        
      if (profileError) {
        throw profileError;
      }
    } catch (error) {
      console.error("Error updating profile CV URL:", error);
      throw error;
    }
    
    // Update the cv_parsed_data table as well if it exists
    try {
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
    } catch (error) {
      console.error("Error updating CV parsed data:", error);
      // Continue even if this fails
    }
    
    toast.success("Default CV updated successfully");
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error setting default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};
