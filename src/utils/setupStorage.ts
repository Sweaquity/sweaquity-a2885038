
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const uploadCV = async (file: File) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("No session found");
    
    const userId = sessionData.session.user.id;
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('cvs')
      .upload(filePath, file);
      
    if (error) throw error;
    
    const { data } = await supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading CV:', error);
    throw error;
  }
};

export const downloadCV = async (filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .download(filePath);
      
    if (error) throw error;
    
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'cv.pdf';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading CV:', error);
    toast.error('Error downloading CV');
  }
};

export const deleteCV = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('cvs')
      .remove([filePath]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  }
};

export const listUserCVs = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("No session found");
    
    const userId = sessionData.session.user.id;
    const { data, error } = await supabase.storage
      .from('cvs')
      .list(userId);
      
    if (error) throw error;
    
    return data.map(file => ({
      ...file,
      url: supabase.storage.from('cvs').getPublicUrl(userId + '/' + file.name).data.publicUrl
    }));
  } catch (error) {
    console.error('Error listing user CVs:', error);
    return [];
  }
};

export const setDefaultCV = async (cvUrl: string) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("No session found");
    
    const userId = sessionData.session.user.id;
    
    const { error } = await supabase
      .from('profiles')
      .update({ cv_url: cvUrl })
      .eq('id', userId);
      
    if (error) throw error;
    
    toast.success('Default CV updated');
    return true;
  } catch (error) {
    console.error('Error setting default CV:', error);
    toast.error('Error updating default CV');
    return false;
  }
};

export const previewCV = async (cvUrl: string) => {
  // Open CV in a new tab
  window.open(cvUrl, '_blank');
};

export const previewApplicationCV = async (cvUrl: string) => {
  try {
    // Extract the path from the URL if needed
    let path = cvUrl;
    if (cvUrl.includes('supabase')) {
      // If it's a URL, open directly
      window.open(cvUrl, '_blank');
      return;
    }
    
    const { data, error } = await supabase.storage
      .from('job_applications')
      .download(path);
      
    if (error) throw error;
    
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error previewing application CV:', error);
    toast.error('Error previewing CV');
  }
};

// Export for TypeScript types
export interface CVFile {
  name: string;
  created_at: string;
  id: string;
  updated_at: string;
  url: string;
  [key: string]: any;
}
