import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Profile, Skill } from "@/types/jobSeeker";

export interface UseProfileReturn {
  profile: Profile | null;
  skills: Skill[] | null;
  isLoading: boolean;
  isSaving: boolean;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updatedProfile: Profile) => Promise<void>;
  handleSkillsUpdate: (newSkills: Skill[]) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Ensure all properties have default values if not present
      const profileData: Profile = {
        id: data.id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        title: data.title || '',
        bio: data.bio || '',
        phone: data.phone || '',
        address: data.address || '',
        location: data.location || '',
        availability: data.availability || '',
        social_links: data.social_links || {},
        marketing_consent: data.marketing_consent ?? false,
        project_updates_consent: data.project_updates_consent ?? false,
        terms_accepted: data.terms_accepted ?? false,
        skills: data.skills || []
      };
      
      setProfile(profileData);
      setSkills(profileData.skills || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (updatedProfile: Profile) => {
    try {
      setIsSaving(true);
      
      if (!updatedProfile.id) {
        throw new Error('Profile ID is required');
      }
      
      // Extract just the fields we want to update to avoid validation errors
      const {
        first_name,
        last_name,
        title,
        bio,
        phone,
        address,
        location,
        availability,
        social_links,
        marketing_consent,
        project_updates_consent,
        terms_accepted
      } = updatedProfile;
      
      const profileUpdate = {
        first_name,
        last_name,
        title,
        bio,
        phone,
        address,
        location,
        availability,
        social_links,
        marketing_consent,
        project_updates_consent,
        terms_accepted
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', updatedProfile.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? {...prev, ...profileUpdate} : null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillsUpdate = async (newSkills: Skill[]) => {
    if (!profile?.id) {
      toast.error('Profile not found');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ skills: newSkills })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update local state
      setSkills(newSkills);
      setProfile(prev => prev ? {...prev, skills: newSkills} : null);
      toast.success('Skills updated successfully');
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error('Failed to update skills');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    skills,
    isLoading,
    isSaving,
    loadProfile,
    updateProfile,
    handleSkillsUpdate
  };
};
