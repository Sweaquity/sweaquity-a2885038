
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadUserSkills = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Error loading user skills:", error);
          return;
        }
        
        let skills: Skill[] = [];
        if (data?.skills) {
          if (typeof data.skills === 'string') {
            try {
              skills = JSON.parse(data.skills);
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          } else {
            skills = data.skills;
          }
        }
        
        setUserSkills(skills || []);
      } catch (error) {
        console.error("Error in useUserSkills:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSkills();
  }, []);
  
  const hasSkill = (skillName: string): boolean => {
    if (!userSkills || userSkills.length === 0) return false;
    
    return userSkills.some(skill => {
      // Make sure we handle both string and object skill formats
      const skillStr = typeof skill === 'string' ? skill : skill.skill;
      return skillStr.toLowerCase() === skillName.toLowerCase();
    });
  };
  
  const getMatchedSkills = (application?: JobApplication): string[] => {
    if (!application || !application.business_roles || !application.business_roles.skill_requirements) {
      return [];
    }
    
    const requiredSkills = application.business_roles.skill_requirements;
    
    const matchedSkills: string[] = [];
    
    userSkills.forEach(userSkill => {
      // Handle both string and object skill formats
      const userSkillName = typeof userSkill === 'string' ? userSkill : userSkill.skill;
      
      requiredSkills.forEach(reqSkill => {
        const reqSkillName = typeof reqSkill === 'string' ? reqSkill : reqSkill.skill;
        if (userSkillName.toLowerCase() === reqSkillName.toLowerCase()) {
          matchedSkills.push(userSkillName);
        }
      });
    });
    
    return matchedSkills;
  };
  
  return {
    userSkills,
    isLoading,
    hasSkill,
    getMatchedSkills
  };
};
