
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
