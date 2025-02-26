
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, Skill } from "@/types/jobSeeker";
import { toast } from "sonner";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, title, email, location, skills')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.skills && Array.isArray(profileData.skills)) {
        const convertedSkills: Skill[] = profileData.skills.map((skill: any) => {
          if (typeof skill === 'string') {
            return { skill: skill, level: 'Intermediate' };
          }
          if ('name' in skill) {
            return { skill: skill.name, level: skill.level };
          }
          return skill as Skill;
        });
        setSkills(convertedSkills);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error("Failed to load profile data");
    }
  };

  const handleSkillsUpdate = async (updatedSkills: Skill[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ skills: updatedSkills })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      const { error: cvDataError } = await supabase
        .from('cv_parsed_data')
        .update({ skills: updatedSkills })
        .eq('user_id', session.user.id);

      if (cvDataError && cvDataError.code !== 'PGRST116') {
        throw cvDataError;
      }

      setSkills(updatedSkills);
      toast.success("Skills updated successfully");
    } catch (error) {
      console.error('Error updating skills:', error);
      toast.error("Failed to update skills");
    }
  };

  return { profile, skills, loadProfile, handleSkillsUpdate };
};
