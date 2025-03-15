
import { supabase } from '@/lib/supabase';
import { CVFile } from '@/hooks/job-seeker/useCVData';

export const uploadCV = async (file: File): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No user session found');
      return null;
    }

    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(`${session.user.id}/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading CV:', error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Error during CV upload:', error);
    return null;
  }
};

export const getCVUrl = (filePath: string): string => {
  try {
    const { data } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting CV URL:', error);
    return '';
  }
};

export const deleteCV = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('cvs')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting CV:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error during CV deletion:', error);
    return false;
  }
};

export const getUserCVs = async (): Promise<CVFile[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No user session found');
      return [];
    }

    const { data: files, error } = await supabase.storage
      .from('cvs')
      .list(`${session.user.id}`);

    if (error) {
      console.error('Error listing CV files:', error);
      return [];
    }

    // Map the files to include the url property required by CVFile type
    return files.map(file => {
      const { data } = supabase.storage
        .from('cvs')
        .getPublicUrl(`${session.user.id}/${file.name}`);
        
      return {
        ...file,
        size: file.metadata?.size || 0,
        url: data.publicUrl
      };
    }) as CVFile[];
  } catch (error) {
    console.error('Error in getUserCVs:', error);
    return [];
  }
};

// Add the missing export functions
export const downloadCV = async (userId: string, fileName: string): Promise<void> => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .download(`${userId}/${fileName}`);
      
    if (error) {
      console.error('Error downloading CV:', error);
      return;
    }
    
    // Create a URL for the file and trigger download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error('Error in downloadCV:', error);
  }
};

export const previewCV = async (userId: string, fileName: string): Promise<void> => {
  try {
    const { data } = supabase.storage
      .from('cvs')
      .getPublicUrl(`${userId}/${fileName}`);
      
    window.open(data.publicUrl, '_blank');
  } catch (error) {
    console.error('Error in previewCV:', error);
  }
};

export const setDefaultCV = async (userId: string, fileName: string): Promise<string | null> => {
  try {
    const { data } = supabase.storage
      .from('cvs')
      .getPublicUrl(`${userId}/${fileName}`);

    const { error } = await supabase
      .from('profiles')
      .update({ cv_url: data.publicUrl })
      .eq('id', userId);
      
    if (error) {
      console.error('Error setting default CV:', error);
      return null;
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in setDefaultCV:', error);
    return null;
  }
};

export const previewApplicationCV = (cvUrl: string): void => {
  try {
    window.open(cvUrl, '_blank');
  } catch (error) {
    console.error('Error in previewApplicationCV:', error);
  }
};

export const listUserCVs = async (userId: string): Promise<any[]> => {
  try {
    const { data: files, error } = await supabase.storage
      .from('cvs')
      .list(`${userId}`);

    if (error) {
      console.error('Error listing user CVs:', error);
      return [];
    }

    return files;
  } catch (error) {
    console.error('Error in listUserCVs:', error);
    return [];
  }
};

export const parseCV = async (cvUrl: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/parse-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv_url: cvUrl }),
    });

    if (!response.ok) {
      console.error('Failed to parse CV:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error parsing CV:', error);
    return null;
  }
};
