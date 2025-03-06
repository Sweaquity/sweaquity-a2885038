
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
      // Error handling without console log
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
    const userSkillNames: string[] = [];
    
    for (const skill of userSkills) {
      if (typeof skill === 'string') {
        userSkillNames.push(String(skill).toLowerCase());
      } else if (skill && typeof skill === 'object' && 'skill' in skill) {
        const skillName = String(skill.skill || '');
        if (skillName) {
          userSkillNames.push(skillName.toLowerCase());
        }
      }
    }

    // Extract skill names from application requirements
    const requiredSkillNames: string[] = [];
    const originalSkillNames: Record<string, string> = {};
    
    for (const req of application.business_roles.skill_requirements) {
      if (req) {
        let skillName = '';
        
        if (typeof req === 'string') {
          skillName = String(req || '').toLowerCase();
          originalSkillNames[skillName] = req;
        } else if (typeof req === 'object' && 'skill' in req) {
          skillName = String(req.skill || '').toLowerCase();
          originalSkillNames[skillName] = req.skill || '';
        }
        
        if (skillName) {
          requiredSkillNames.push(skillName);
        }
      }
    }

    // Find the intersection of user skills and required skills
    const matchedSkills = requiredSkillNames.filter(reqSkill => 
      userSkillNames.includes(reqSkill)
    );

    // Return the original case versions of the matched skills
    return matchedSkills.map(skill => originalSkillNames[skill] || skill);
  };

  return {
    userSkills,
    isLoading,
    loadUserSkills,
    getMatchedSkills
  };
};
