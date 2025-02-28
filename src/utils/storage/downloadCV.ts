
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    
    toast.success("Downloaded CV successfully");
    return true;
  } catch (error) {
    console.error("Error downloading CV:", error);
    toast.error("Failed to download CV");
    return false;
  }
};
