
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill, JobApplication } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserSkills = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const skills = profileData?.skills || [];
      setUserSkills(skills);
    } catch (error) {
      console.error("Error loading user skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadUserSkills(user.id);
      }
    };

    fetchUserData();
  }, []);

  // This function returns an array of skill names that match between 
  // the user's skills and the application's required skills
  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!application.business_roles?.skill_requirements || !userSkills || userSkills.length === 0) {
      return [];
    }

    // Get all skill names from user skills
    const userSkillNames = userSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
    );

    // Extract skill names from application requirements
    const requiredSkillNames = application.business_roles.skill_requirements.map(req => {
      if (typeof req === 'string') {
        return req.toLowerCase();
      } else if (req && typeof req === 'object' && 'skill' in req) {
        return req.skill.toLowerCase();
      }
      return '';
    }).filter(Boolean);

    // Find the intersection of user skills and required skills
    const matchedSkills = requiredSkillNames.filter(reqSkill => 
      userSkillNames.includes(reqSkill)
    );

    // Return the original case versions of the matched skills
    return application.business_roles.skill_requirements
      .filter(req => {
        const skillName = typeof req === 'string' 
          ? req.toLowerCase() 
          : (req && typeof req === 'object' && 'skill' in req) 
            ? req.skill.toLowerCase()
            : '';
        return matchedSkills.includes(skillName);
      })
      .map(req => typeof req === 'string' ? req : req.skill);
  };

  return {
    userSkills,
    isLoading,
    loadUserSkills,
    getMatchedSkills
  };
};
