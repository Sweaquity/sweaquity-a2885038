
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

    // Get all skill names from user skills - with proper type checking
    const userSkillNames: string[] = [];
    
    for (const skill of userSkills) {
      if (typeof skill === 'string') {
        userSkillNames.push(skill.toLowerCase());
      } else if (skill && typeof skill === 'object' && 'skill' in skill) {
        userSkillNames.push(skill.skill.toLowerCase());
      }
    }

    // Extract skill names from application requirements
    const requiredSkillNames: string[] = [];
    
    for (const req of application.business_roles.skill_requirements || []) {
      if (typeof req === 'string') {
        requiredSkillNames.push(req.toLowerCase());
      } else if (req && typeof req === 'object' && 'skill' in req) {
        requiredSkillNames.push(req.skill.toLowerCase());
      }
    }

    // Find the intersection of user skills and required skills
    const matchedSkills = requiredSkillNames.filter(reqSkill => 
      userSkillNames.includes(reqSkill)
    );

    // Return the original case versions of the matched skills
    const result: string[] = [];
    
    for (const req of application.business_roles.skill_requirements || []) {
      let skillName = '';
      
      if (typeof req === 'string') {
        skillName = req.toLowerCase();
        if (matchedSkills.includes(skillName)) {
          result.push(req);
        }
      } else if (req && typeof req === 'object' && 'skill' in req) {
        skillName = req.skill.toLowerCase();
        if (matchedSkills.includes(skillName)) {
          result.push(req.skill);
        }
      }
    }

    return result;
  };

  return {
    userSkills,
    isLoading,
    loadUserSkills,
    getMatchedSkills
  };
};
