
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const downloadCV = async (filePath: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("You must be logged in to download CVs");
      return;
    }

    const { data, error } = await supabase.storage
      .from('CVs Storage')
      .download(filePath);

    if (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV");
      return;
    }

    // Create a URL for the file and trigger download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'cv-file';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error("Error downloading CV:", error);
    toast.error("Failed to download CV");
    return false;
  }
};

export const deleteCV = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('CVs Storage')
      .remove([filePath]);

    if (error) {
      console.error("Error deleting CV:", error);
      toast.error("Failed to delete CV");
      return false;
    }

    toast.success("CV deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting CV:", error);
    toast.error("Failed to delete CV");
    return false;
  }
};

export const previewCV = async (filePath: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("You must be logged in to preview CVs");
      return;
    }

    const { data, error } = await supabase.storage
      .from('CVs Storage')
      .download(filePath);

    if (error) {
      console.error("Error previewing CV:", error);
      toast.error("Failed to preview CV");
      return;
    }

    // Create a URL for the file and open in a new tab
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
    
    // Don't forget to revoke the object URL when done
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error("Error previewing CV:", error);
    toast.error("Failed to preview CV");
    return false;
  }
};

export const setDefaultCV = async (userId: string, fileName: string) => {
  try {
    // Create public URL for the CV
    const { data } = supabase.storage
      .from('CVs Storage')
      .getPublicUrl(`${userId}/${fileName}`);

    if (!data.publicUrl) {
      toast.error("Failed to set default CV");
      return null;
    }

    // Update the profile with the new CV URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cv_url: data.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile with CV URL:", updateError);
      toast.error("Failed to set default CV");
      return null;
    }

    toast.success("Default CV updated successfully");
    return data.publicUrl;
  } catch (error) {
    console.error("Error setting default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};

// New function to preview Application CV
export const previewApplicationCV = async (cvUrl: string) => {
  try {
    if (!cvUrl) {
      toast.error("No CV URL provided");
      return false;
    }

    // Check if this is a direct URL or a file path
    if (cvUrl.startsWith('http')) {
      // Direct URL, just open it
      window.open(cvUrl, '_blank');
      return true;
    }
    
    // Otherwise, try to download from Supabase storage
    let bucket = 'job_applications';
    let filePath = cvUrl;
    
    // If the path includes the bucket name, extract it
    if (cvUrl.includes('job_applications/')) {
      filePath = cvUrl.split('job_applications/')[1];
    } else if (cvUrl.includes('job-applications/')) {
      bucket = 'job-applications';
      filePath = cvUrl.split('job-applications/')[1];
    } else if (cvUrl.includes('CVs Storage/')) {
      bucket = 'CVs Storage';
      filePath = cvUrl.split('CVs Storage/')[1];
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error("Error downloading application CV:", error);
      toast.error("Failed to preview CV");
      return false;
    }

    // Create a URL for the file and open in a new tab
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
    
    // Don't forget to revoke the object URL when done
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error("Error previewing application CV:", error);
    toast.error("Failed to preview CV");
    return false;
  }
};

// New function to list user CVs
export const listUserCVs = async (userId: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .list(`${userId}/`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error("Error listing CVs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error listing CVs:", error);
    return [];
  }
};

// Add new function to test storage permissions
export const checkStoragePermissions = async (bucketName: string, folderPath: string) => {
  try {
    console.log(`Checking storage permissions for ${bucketName}/${folderPath}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("Not authenticated");
      return { success: false, error: "Not authenticated", details: { userId: null, authenticated: false } };
    }
    
    // Try to list files to check permissions
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);
    
    if (error) {
      console.error("Storage permission check failed:", error);
      return { 
        success: false, 
        error: error.message,
        details: {
          statusText: error.message,
          bucket: bucketName,
          path: folderPath,
          userId: session.user.id,
          authenticated: true
        }
      };
    }
    
    return { 
      success: true, 
      files: data,
      details: {
        bucket: bucketName,
        path: folderPath,
        userId: session.user.id,
        authenticated: true,
        fileCount: data?.length || 0
      }
    };
  } catch (error: any) {
    console.error("Error checking storage permissions:", error);
    return { 
      success: false, 
      error: error.message,
      details: {
        error: error.message,
        stack: error.stack
      }
    };
  }
};

// New function to get a signed URL with retries and fallback to public URL
export const getSecureFileUrl = async (bucketName: string, filePath: string, expirySeconds = 3600) => {
  try {
    // First try to get a signed URL (more secure)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expirySeconds);
    
    if (signedData?.signedUrl) {
      return { url: signedData.signedUrl, success: true };
    }
    
    if (signedError) {
      console.warn(`Failed to create signed URL for ${bucketName}/${filePath}:`, signedError);
      
      // Fall back to public URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      if (publicData?.publicUrl) {
        return { url: publicData.publicUrl, success: true, isPublic: true };
      }
    }
    
    return { success: false, error: signedError || "Could not generate URL" };
  } catch (error: any) {
    console.error(`Error getting file URL for ${bucketName}/${filePath}:`, error);
    return { success: false, error };
  }
};
