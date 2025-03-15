import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CVFile {
  name: string;
  size: number;
  created_at: string;
  isDefault?: boolean;
}

// Setup storage buckets
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
    
    // Check if job_applications bucket exists
    const jobAppsBucketExists = buckets.some(bucket => bucket.name === 'job_applications');
    
    if (!jobAppsBucketExists) {
      // Create the job_applications bucket
      const { error: createError } = await supabase.storage.createBucket('job_applications', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error("Error creating job_applications bucket:", createError);
        return false;
      }
      
      console.log("Job applications storage bucket created successfully");
    }
    
    // Check if cvs bucket exists
    const cvsBucketExists = buckets.some(bucket => bucket.name === 'cvs');
    
    if (!cvsBucketExists) {
      // Create the cvs bucket
      const { error: createError } = await supabase.storage.createBucket('cvs', {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error("Error creating cvs bucket:", createError);
        return false;
      }
      
      console.log("CVs storage bucket created successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error setting up storage:", error);
    return false;
  }
};

// CV Management Functions
export const downloadCV = async (userId: string, fileName: string) => {
  try {
    console.log(`Downloading CV: ${fileName} for user: ${userId}`);
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase
      .storage
      .from('cvs')
      .download(filePath);
      
    if (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV");
      return false;
    }
    
    // Create a URL for the downloaded file
    const url = URL.createObjectURL(data);
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CV downloaded successfully");
    return true;
  } catch (error) {
    console.error("Error downloading CV:", error);
    toast.error("Failed to download CV");
    return false;
  }
};

export const deleteCV = async (userId: string, fileName: string) => {
  try {
    console.log(`Deleting CV: ${fileName} for user: ${userId}`);
    const filePath = `${userId}/${fileName}`;
    
    const { error } = await supabase
      .storage
      .from('cvs')
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

export const previewCV = async (userId: string, fileName: string) => {
  try {
    console.log(`Previewing CV: ${fileName} for user: ${userId}`);
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase
      .storage
      .from('cvs')
      .createSignedUrl(filePath, 300); // 5 minutes expiry
      
    if (error) {
      console.error("Error creating signed URL for CV preview:", error);
      toast.error("Failed to preview CV");
      return false;
    }
    
    // Open the signed URL in a new tab
    window.open(data.signedUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error("Error previewing CV:", error);
    toast.error("Failed to preview CV");
    return false;
  }
};

export const setDefaultCV = async (userId: string, fileName: string) => {
  try {
    console.log(`Setting default CV: ${fileName} for user: ${userId}`);
    const filePath = `${userId}/${fileName}`;
    
    // Get public URL for the CV
    const { data: urlData } = supabase
      .storage
      .from('cvs')
      .getPublicUrl(filePath);
      
    // Update the user's profile to set this CV as default
    const { error } = await supabase
      .from('profiles')
      .update({ cv_url: urlData.publicUrl })
      .eq('id', userId);
      
    if (error) {
      console.error("Error setting default CV:", error);
      toast.error("Failed to set default CV");
      return null;
    }
    
    toast.success("Default CV updated successfully");
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error setting default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};

// List all CVs for a user
export const listUserCVs = async (userId: string): Promise<CVFile[]> => {
  try {
    console.log(`Listing CVs for user: ${userId}`);
    
    const { data, error } = await supabase
      .storage
      .from('cvs')
      .list(`${userId}`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
    if (error) {
      console.error("Error listing CVs:", error);
      return [];
    }
    
    // Get user's default CV URL
    const { data: profileData } = await supabase
      .from('profiles')
      .select('cv_url')
      .eq('id', userId)
      .maybeSingle();
      
    const defaultCvUrl = profileData?.cv_url || null;
    
    // Mark default CV in the list
    return data.map(file => {
      const { data: urlData } = supabase
        .storage
        .from('cvs')
        .getPublicUrl(`${userId}/${file.name}`);
        
      return {
        ...file,
        isDefault: defaultCvUrl === urlData.publicUrl
      };
    });
  } catch (error) {
    console.error("Error listing CVs:", error);
    return [];
  }
};

// Function to preview application CV
export const previewApplicationCV = async (cvUrl: string) => {
  try {
    console.log(`Previewing Application CV: ${cvUrl}`);
    
    // If it's already a full URL, just open it
    if (cvUrl.startsWith('http')) {
      window.open(cvUrl, '_blank');
      return true;
    }
    
    // Otherwise, create a signed URL
    const fileName = cvUrl.split('/').pop() || '';
    const { data, error } = await supabase
      .storage
      .from('job_applications')
      .createSignedUrl(cvUrl, 300); // 5 minutes expiry
      
    if (error) {
      console.error("Error creating signed URL for CV preview:", error);
      toast.error("Failed to preview CV");
      return false;
    }
    
    // Open the signed URL in a new tab
    window.open(data.signedUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error("Error previewing application CV:", error);
    toast.error("Failed to preview CV");
    return false;
  }
};

// Run the setup function
setupContractStorage();
