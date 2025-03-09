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
    console.error("Failed to retrieve CV list:", error);
    return [];
  }
};

export const downloadCV = async (userId: string, fileName: string, bucketName = 'cvs') => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
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
    console.error(`Failed to download CV from ${bucketName}:`, error);
    toast.error("Failed to download CV");
    return false;
  }
};

export const downloadApplicationCV = async (cvUrl: string) => {
  try {
    if (!cvUrl) {
      toast.error("CV URL is not available");
      return false;
    }
    
    // For direct download, try to fetch the file directly
    try {
      const response = await fetch(cvUrl);
      if (response.ok) {
        const blob = await response.blob();
        const fileName = cvUrl.split('/').pop()?.split('?')[0] || 'cv.pdf';
        
        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);
        
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
      }
    } catch (fetchError) {
      console.log("Direct fetch failed, trying storage API:", fetchError);
    }
    
    // If direct fetch failed, try to extract the application ID and filename
    // Use regex to extract application ID and filename from various URL formats
    const match = cvUrl.match(/\/([^\/]+)\/([^\/\?]+)(?:\?.*)?$/);
    
    if (match && match.length >= 3) {
      const possibleApplicationId = match[1];
      const encodedFileName = match[2];
      
      // Decode the filename
      const fileName = decodeURIComponent(encodedFileName);
      
      console.log("Attempting to download from job_applications bucket:", possibleApplicationId, fileName);
      
      // Construct the path for the storage download
      const filePath = `${possibleApplicationId}/${fileName}`;
      
      // Download using the storage API
      const { data, error } = await supabase.storage
        .from('job_applications')
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
    } else {
      toast.error("Invalid CV URL format");
      return false;
    }
  } catch (error: any) {
    console.error("Failed to download application CV:", error);
    toast.error("Failed to download CV: " + (error.message || "Unknown error"));
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
    console.error("Failed to delete CV:", error);
    toast.error("Failed to delete CV");
    return false;
  }
};

export const previewCV = async (userId: string, fileName: string, bucketName = 'cvs') => {
  try {
    const filePath = `${userId}/${fileName}`;
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    if (data?.publicUrl) {
      // Open the file directly in a new tab, ensuring it opens properly
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error(`Failed to preview CV from ${bucketName}:`, error);
    toast.error("Failed to preview CV");
    return false;
  }
};

export const previewApplicationCV = async (cvUrl: string) => {
  if (!cvUrl) {
    toast.error("CV URL is not available");
    return false;
  }
  
  try {
    // Try to download the CV instead of previewing
    return await downloadApplicationCV(cvUrl);
  } catch (error: any) {
    console.error("Failed to download application CV:", error);
    toast.error("Failed to download CV: " + (error.message || "Unknown error"));
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
    console.error("Failed to set default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};
