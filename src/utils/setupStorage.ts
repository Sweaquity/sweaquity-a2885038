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
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('CVs Storage')
      .getPublicUrl(`${userId}/${fileName}`);

    if (urlError) {
      console.error("Error creating public URL:", urlError);
      toast.error("Failed to set default CV");
      return null;
    }

    // Update the profile with the new CV URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cv_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile with CV URL:", updateError);
      toast.error("Failed to set default CV");
      return null;
    }

    toast.success("Default CV updated successfully");
    return publicUrl;
  } catch (error) {
    console.error("Error setting default CV:", error);
    toast.error("Failed to set default CV");
    return null;
  }
};
