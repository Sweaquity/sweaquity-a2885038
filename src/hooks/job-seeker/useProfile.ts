
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Profile, Skill } from "@/types/jobSeeker";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);

  const loadProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw error;
      }

      // Parse availability from string to array if needed
      if (data.availability) {
        try {
          if (typeof data.availability === 'string' && data.availability.startsWith('[')) {
            data.availability = JSON.parse(data.availability);
          } else if (typeof data.availability === 'string') {
            // If it's a single string value, convert to array with one item
            data.availability = [data.availability];
          }
        } catch (e) {
          // Keep it as is if parsing fails
        }
      } else {
        data.availability = [];
      }
      
      // Load skills
      let parsedSkills: Skill[] = [];
      if (data.skills) {
        try {
          if (typeof data.skills === 'string') {
            parsedSkills = JSON.parse(data.skills);
          } else {
            parsedSkills = data.skills;
          }
        } catch (e) {
          // Parsing failed, keep empty array
        }
      }
      
      // Make sure to include the id and account_type in the profile data
      const profileWithId: Profile = {
        id: userId, // Ensure id is included
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        email: data.email,
        location: data.location,
        account_type: data.account_type || 'job_seeker' // Include account_type with default
      };
      
      setProfile(profileWithId);
      setSkills(parsedSkills);
    } catch (error) {
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillsUpdate = async (updatedSkills: Skill[]) => {
    if (!profile) return;
    
    try {
      // Update in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          skills: updatedSkills,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update local state
      setSkills(updatedSkills);
      toast.success("Skills updated successfully");
    } catch (error) {
      toast.error("Failed to update skills");
    }
  };

  return {
    profile,
    isLoading,
    skills,
    loadProfile,
    handleSkillsUpdate
  };
};
