import { supabase } from '@/lib/supabase';
import { CVFile } from '@/hooks/job-seeker/useCVData';

export const uploadCV = async (file: File): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(`${supabase.auth.user()?.id || 'unknown'}/${file.name}`, file, {
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
    const { publicURL } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);
    return publicURL;
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
    const { data: files, error } = await supabase.storage
      .from('cvs')
      .list(`${supabase.auth.user()?.id || 'unknown'}`);

    if (error) {
      console.error('Error listing CV files:', error);
      return [];
    }

    // Map the files to include the size property required by CVFile type
    return files.map(file => ({
      ...file,
      size: file.metadata?.size || 0, // Add the size property with a default of 0
    })) as CVFile[];
  } catch (error) {
    console.error('Error in getUserCVs:', error);
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
