
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const setupCvStorageBucket = async () => {
  // Skip bucket checks, always return true to indicate "ready"
  return true;
};

export const listUserCVs = async (userId: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .list(userId);
      
    if (error) {
      throw error;
    }
    
    // Filter out folder objects, keep only files
    return data?.filter(item => !item.id.endsWith('/')) || [];
    
  } catch (error: any) {
    toast.error("Failed to retrieve CV list");
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
  } catch (error: any) {
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
          
        // Also update the CV parsed data if it exists
        await supabase
          .from('cv_parsed_data')
          .update({ cv_url: null })
          .eq('user_id', userId);
      }
    }
    
    toast.success("CV deleted successfully");
    return true;
  } catch (error: any) {
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
      // Open the file directly in a new tab, ensuring it opens properly
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
    
    return false;
  } catch (error: any) {
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
  } catch (error: any) {
    toast.error("Failed to set default CV");
    return null;
  }
};
