
// This file needs to be created or updated
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user skills:', error);
          return;
        }

        if (profileData?.skills) {
          let parsedSkills: Skill[] = [];
          try {
            if (typeof profileData.skills === 'string') {
              parsedSkills = JSON.parse(profileData.skills);
            } else if (Array.isArray(profileData.skills)) {
              parsedSkills = profileData.skills;
            } else if (typeof profileData.skills === 'object') {
              parsedSkills = Object.values(profileData.skills);
            }
          } catch (e) {
            console.error('Error parsing skills:', e);
          }

          setUserSkills(parsedSkills);
        }
      } catch (error) {
        console.error('Error in useUserSkills:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application: JobApplication): (string | { skill: string; level: string })[] => {
    if (!application.business_roles?.skill_requirements || !userSkills) {
      return [];
    }

    const taskSkills = application.business_roles.skill_requirements;
    return userSkills.filter(userSkill => {
      // Fixed: Check if userSkill is a string or an object before using toLowerCase
      const userSkillName = typeof userSkill === 'string' 
        ? userSkill.toLowerCase() 
        : (userSkill && typeof userSkill === 'object' && 'skill' in userSkill && typeof userSkill.skill === 'string'
            ? userSkill.skill.toLowerCase()
            : '');

      if (!userSkillName) return false;

      return taskSkills.some(taskSkill => {
        if (typeof taskSkill === 'string') {
          return taskSkill.toLowerCase() === userSkillName;
        }
        if (taskSkill && typeof taskSkill === 'object' && 'skill' in taskSkill && typeof taskSkill.skill === 'string') {
          return taskSkill.skill.toLowerCase() === userSkillName;
        }
        return false;
      });
    });
  };

  return {
    userSkills,
    isLoading,
    getMatchedSkills
  };
};
